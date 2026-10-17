import asyncio
import html
import ipaddress
import re
import socket
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from typing import Any
from urllib.parse import urljoin, urlsplit, quote

import httpx

from api.config import settings
from api.schemas import PreviewResponse, ScreenshotStatus, PreviewStatus

# Comprehensive blocked CIDR ranges for SSRF protection
BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("192.88.99.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
    ipaddress.ip_network("224.0.0.0/4"),
    ipaddress.ip_network("240.0.0.0/4"),
    ipaddress.ip_network("255.255.255.255/32"),
    # IPv6 ranges
    ipaddress.ip_network("::/128"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("::ffff:0:0/96"),  # IPv4-mapped IPv6
    ipaddress.ip_network("64:ff9b::/96"),
    ipaddress.ip_network("100::/64"),
    ipaddress.ip_network("2001::/23"),
    ipaddress.ip_network("2001:db8::/32"),
    ipaddress.ip_network("fc00::/7"),  # Unique local
    ipaddress.ip_network("fe80::/10"),  # Link-local
    ipaddress.ip_network("ff00::/8"),  # Multicast
]

BLOCKED_HOSTNAMES = {
    "localhost",
    "metadata.google.internal",
    "metadata.internal",
    "instance-data",
    "169.254.169.254",
    "100.100.100.200",
}

# In-memory preview cache: normalized_url -> (timestamp, PreviewResponse)
_preview_cache: dict[str, tuple[float, PreviewResponse]] = {}
_cache_lock = asyncio.Lock()
_in_flight_tasks: dict[str, asyncio.Task] = {}


def is_ip_blocked(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Checks if an IP address belongs to any private or reserved network."""
    if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local or ip.is_multicast:
        return True
    for net in BLOCKED_NETWORKS:
        if ip in net:
            return True
    return False


async def check_destination_ssrf(hostname: str) -> tuple[bool, str | None, list[str]]:
    """
    Validates that a hostname does not resolve to any blocked or private IP address.
    Returns: (is_blocked, reason_if_blocked, list_of_resolved_ips)
    """
    clean_host = hostname.strip("[]").lower()

    if clean_host in BLOCKED_HOSTNAMES:
        return True, f"Access to restricted host '{clean_host}' is blocked.", []

    # Check if host is direct IP literal
    try:
        ip_obj = ipaddress.ip_address(clean_host)
        if is_ip_blocked(ip_obj):
            return True, f"Access to private/reserved IP address '{clean_host}' is blocked.", [str(ip_obj)]
        return False, None, [str(ip_obj)]
    except ValueError:
        pass

    # Resolve hostname via DNS
    loop = asyncio.get_running_loop()
    try:
        addr_info = await asyncio.wait_for(
            loop.getaddrinfo(clean_host, None, family=socket.AF_UNSPEC, type=socket.SOCK_STREAM),
            timeout=3.0
        )
    except (socket.gaierror, asyncio.TimeoutError):
        # Could not resolve; let caller handle as NXDOMAIN / unreachable
        return False, None, []
    except Exception as e:
        return True, f"DNS resolution failed safely: {str(e)}", []

    resolved_ips = []
    for entry in addr_info:
        sockaddr = entry[4]
        raw_ip = sockaddr[0]
        resolved_ips.append(raw_ip)
        try:
            ip_obj = ipaddress.ip_address(raw_ip)
            if is_ip_blocked(ip_obj):
                return True, f"Destination resolves to blocked IP '{raw_ip}'.", resolved_ips
        except ValueError:
            return True, f"Unparseable resolved IP '{raw_ip}'.", resolved_ips

    return False, None, resolved_ips


def sanitize_text(text: str | None, max_len: int = 300) -> str | None:
    """Sanitizes text by stripping HTML tags, unescaping entities, and capping length."""
    if not text:
        return None
    # Strip any HTML tags that might be inside content
    cleaned = re.sub(r"<[^>]+>", " ", text)
    cleaned = html.unescape(cleaned)
    # Normalize whitespace
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if not cleaned:
        return None
    if len(cleaned) > max_len:
        return cleaned[:max_len].rstrip() + "..."
    return cleaned


class HTMLMetadataParser(HTMLParser):
    """Safe, streaming HTML parser for title, description, favicon, and og:image."""

    def __init__(self):
        super().__init__()
        self.title_parts: list[str] = []
        self._in_title = False
        self.description: str | None = None
        self.og_description: str | None = None
        self.og_title: str | None = None
        self.og_image: str | None = None
        self.favicon: str | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]):
        tag_lower = tag.lower()
        attr_dict = {k.lower(): (v or "") for k, v in attrs}

        if tag_lower == "title" and not self.title_parts:
            self._in_title = True

        elif tag_lower == "meta":
            name = attr_dict.get("name", "").lower()
            prop = attr_dict.get("property", "").lower()
            content = attr_dict.get("content", "")

            if name == "description" and not self.description:
                self.description = content
            elif prop == "og:description" and not self.og_description:
                self.og_description = content
            elif prop == "og:title" and not self.og_title:
                self.og_title = content
            elif prop == "og:image" and not self.og_image:
                self.og_image = content

        elif tag_lower == "link":
            rel = attr_dict.get("rel", "").lower().split()
            href = attr_dict.get("href", "")
            if href and any(r in rel for r in ("icon", "shortcut", "apple-touch-icon")):
                if not self.favicon or "icon" in rel:
                    self.favicon = href

    def handle_endtag(self, tag: str):
        if tag.lower() == "title":
            self._in_title = False

    def handle_data(self, data: str):
        if self._in_title and len(self.title_parts) < 10:
            self.title_parts.append(data)


async def fetch_html_and_metadata(
    target_url: str,
    max_redirects: int = 5,
    timeout: float = 6.0
) -> tuple[str, list[str], dict[str, Any], str | None]:
    """
    Follows redirects with SSRF revalidation at each step, then parses HTML metadata.
    Returns: (final_url, redirect_chain, metadata_dict, error_message_if_any)
    """
    current_url = target_url
    redirect_chain: list[str] = [current_url]
    visited = {current_url}

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (LinkShield/1.0 Preview Bot)"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    async with httpx.AsyncClient(verify=True, timeout=timeout, follow_redirects=False) as client:
        for _ in range(max_redirects + 1):
            parsed = urlsplit(current_url)
            if parsed.scheme.lower() not in ("http", "https"):
                return current_url, redirect_chain, {}, f"Unsupported scheme: {parsed.scheme}"

            hostname = parsed.hostname or ""
            if not hostname:
                return current_url, redirect_chain, {}, "Missing destination hostname."

            # SSRF revalidation on every hop
            is_blocked, reason, ips = await check_destination_ssrf(hostname)
            if is_blocked:
                return current_url, redirect_chain, {}, reason or "Blocked by SSRF policy."
            if not ips:
                # DNS failure on hop
                return current_url, redirect_chain, {}, f"Destination '{hostname}' does not resolve in DNS."

            try:
                response = await client.get(current_url, headers=headers)
            except httpx.TimeoutException:
                return current_url, redirect_chain, {}, f"Connection to '{hostname}' timed out."
            except Exception as e:
                return current_url, redirect_chain, {}, f"Unable to connect to '{hostname}': {str(e)}"

            if response.status_code in (301, 302, 303, 307, 308):
                location = response.headers.get("Location")
                if not location:
                    break
                next_url = urljoin(current_url, location)
                if next_url in visited:
                    # Redirect loop detected
                    return current_url, redirect_chain, {}, "Redirect loop detected."
                visited.add(next_url)
                redirect_chain.append(next_url)
                current_url = next_url
                continue

            # Reached final destination
            break

        # Check content type before parsing
        content_type = response.headers.get("Content-Type", "").lower()
        html_content = ""
        if "text/html" in content_type or "application/xhtml" in content_type or not content_type:
            # Read at most 512 KB of text to prevent memory issues
            raw_bytes = response.content[:524288]
            html_content = raw_bytes.decode(response.encoding or "utf-8", errors="replace")

        parser = HTMLMetadataParser()
        try:
            parser.feed(html_content)
        except Exception:
            pass

        raw_title = "".join(parser.title_parts) or parser.og_title
        raw_desc = parser.description or parser.og_description

        title = sanitize_text(raw_title, max_len=200)
        description = sanitize_text(raw_desc, max_len=400)

        # Resolve favicon URL
        favicon_url = None
        if parser.favicon:
            fav_candidate = urljoin(current_url, parser.favicon)
            if fav_candidate.startswith(("http://", "https://")):
                favicon_url = fav_candidate
        if not favicon_url:
            parsed_final = urlsplit(current_url)
            favicon_url = f"{parsed_final.scheme}://{parsed_final.netloc}/favicon.ico"

        # Resolve og:image URL
        og_image_url = None
        if parser.og_image:
            og_candidate = urljoin(current_url, parser.og_image)
            if og_candidate.startswith(("http://", "https://")):
                og_image_url = og_candidate

        metadata = {
            "title": title,
            "description": description,
            "favicon_url": favicon_url,
            "og_image_url": og_image_url,
        }

        return current_url, redirect_chain, metadata, None


async def capture_screenshot(target_url: str, timeout: float = 8.0) -> tuple[str | None, ScreenshotStatus, str | None]:
    """
    Captures a screenshot of the target URL using an isolated browser service.
    Returns: (screenshot_url, screenshot_status, error_message)
    """
    service_base = settings.screenshot_service_url
    if not service_base:
        return None, "unsupported", "No screenshot service configured."

    # Using Microlink API in isolated browser sandbox
    encoded_url = quote(target_url, safe="")
    req_url = f"{service_base}?url={encoded_url}&screenshot=true&meta=false"

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(req_url)
            if resp.status_code == 200:
                data = resp.json()
                shot_data = data.get("data", {}).get("screenshot", {})
                shot_url = shot_data.get("url")
                if shot_url and str(shot_url).startswith("https://"):
                    return shot_url, "available", None
                return None, "failed", "Screenshot service returned no image URL."
            elif resp.status_code == 429:
                return None, "failed", "Screenshot service rate limit reached."
            else:
                return None, "failed", f"Screenshot service responded with HTTP {resp.status_code}."
    except httpx.TimeoutException:
        return None, "failed", "Screenshot capture timed out."
    except Exception as e:
        return None, "failed", f"Screenshot capture error: {str(e)}"


async def generate_preview(input_url: str) -> PreviewResponse:
    """
    Generates website preview and link intelligence data for a given URL.
    Handles URL normalization, SSRF protection, redirect resolution,
    metadata extraction, and screenshot capture with caching.
    """
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Basic validation and normalization
    stripped = input_url.strip() if input_url else ""
    if not stripped:
        return PreviewResponse(
            input_url=input_url,
            final_url=input_url,
            domain="",
            status="failed",
            screenshot_status="failed",
            error_message="URL cannot be empty.",
            generated_at=now_iso,
        )

    # Prepend scheme if absent
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", stripped):
        working_url = "https://" + stripped
    else:
        working_url = stripped

    parsed = urlsplit(working_url)
    scheme = parsed.scheme.lower()
    if scheme not in ("http", "https"):
        return PreviewResponse(
            input_url=stripped,
            final_url=working_url,
            domain=parsed.hostname or "",
            status="failed",
            screenshot_status="unsupported",
            error_message=f"Unsupported URL scheme '{scheme}'. Only HTTP and HTTPS are permitted.",
            generated_at=now_iso,
        )

    hostname = (parsed.hostname or "").rstrip(".").lower()
    if not hostname:
        return PreviewResponse(
            input_url=stripped,
            final_url=working_url,
            domain="",
            status="failed",
            screenshot_status="unsupported",
            error_message="URL does not contain a valid hostname.",
            generated_at=now_iso,
        )

    norm_netloc = hostname
    if parsed.port and not ((scheme == "http" and parsed.port == 80) or (scheme == "https" and parsed.port == 443)):
        norm_netloc = f"{hostname}:{parsed.port}"
    normalized_url = f"{scheme}://{norm_netloc}{parsed.path or '/'}{('?' + parsed.query) if parsed.query else ''}"

    # 2. Check in-memory cache
    async with _cache_lock:
        if normalized_url in _preview_cache:
            cache_time, cached_resp = _preview_cache[normalized_url]
            if time.time() - cache_time < settings.preview_cache_ttl_seconds:
                return cached_resp

    # 3. Deduplicate in-flight requests for the same URL
    async with _cache_lock:
        if normalized_url in _in_flight_tasks:
            task = _in_flight_tasks[normalized_url]
        else:
            task = asyncio.create_task(_execute_preview_generation(stripped, normalized_url, hostname))
            _in_flight_tasks[normalized_url] = task

    try:
        result = await task
    finally:
        async with _cache_lock:
            _in_flight_tasks.pop(normalized_url, None)

    # 4. Cache successful or well-formed results
    async with _cache_lock:
        _preview_cache[normalized_url] = (time.time(), result)

    return result


async def _execute_preview_generation(
    input_url: str,
    normalized_url: str,
    initial_hostname: str
) -> PreviewResponse:
    """Internal execution logic for generating preview."""
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. SSRF check on initial target
    is_blocked, block_reason, ips = await check_destination_ssrf(initial_hostname)
    if is_blocked:
        return PreviewResponse(
            input_url=input_url,
            final_url=normalized_url,
            domain=initial_hostname,
            status="blocked",
            screenshot_status="unsupported",
            error_message=block_reason or "Restricted network address.",
            generated_at=now_iso,
        )

    if not ips:
        return PreviewResponse(
            input_url=input_url,
            final_url=normalized_url,
            domain=initial_hostname,
            status="site_not_found",
            screenshot_status="unsupported",
            error_message=f"Domain '{initial_hostname}' does not exist in public DNS.",
            generated_at=now_iso,
        )

    # 2. Concurrently fetch HTML metadata & follow redirects, and capture screenshot
    # HTML metadata fetch gives us verified final URL after redirects
    final_url, redirect_chain, metadata, fetch_err = await fetch_html_and_metadata(
        normalized_url,
        max_redirects=5,
        timeout=settings.preview_timeout_seconds
    )

    if fetch_err and ("blocked" in fetch_err.lower() or "ssrf" in fetch_err.lower()):
        return PreviewResponse(
            input_url=input_url,
            final_url=final_url,
            domain=initial_hostname,
            redirect_chain=redirect_chain,
            status="blocked",
            screenshot_status="unsupported",
            error_message=fetch_err,
            generated_at=now_iso,
        )

    final_domain = (urlsplit(final_url).hostname or initial_hostname).lower()

    # 3. Screenshot capture on final URL
    screenshot_url = None
    screenshot_status: ScreenshotStatus = "unsupported"
    screenshot_error = None

    if not fetch_err or (fetch_err and "timed out" not in fetch_err and "nxdomain" not in fetch_err.lower()):
        shot_url, shot_status, shot_err = await capture_screenshot(
            final_url,
            timeout=settings.preview_timeout_seconds
        )
        screenshot_url = shot_url
        screenshot_status = shot_status
        screenshot_error = shot_err

    # 4. Determine overall status
    overall_status: PreviewStatus = "ready"
    if screenshot_status == "failed" and (not metadata.get("title") and not metadata.get("description")):
        overall_status = "failed"
    elif screenshot_status == "failed":
        overall_status = "screenshot_failed"
    elif not screenshot_url and not metadata.get("title"):
        overall_status = "failed"

    return PreviewResponse(
        input_url=input_url,
        final_url=final_url,
        domain=final_domain,
        title=metadata.get("title"),
        description=metadata.get("description"),
        favicon_url=metadata.get("favicon_url"),
        og_image_url=metadata.get("og_image_url"),
        screenshot_url=screenshot_url,
        screenshot_status=screenshot_status,
        screenshot_error=screenshot_error,
        redirect_chain=redirect_chain if len(redirect_chain) > 1 else [],
        status=overall_status,
        error_message=fetch_err if (overall_status in ("failed", "blocked") and not metadata.get("title")) else None,
        generated_at=now_iso,
    )

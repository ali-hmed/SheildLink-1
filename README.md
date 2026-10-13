# LinkShield — URL Security Analyzer

LinkShield is a portfolio-grade, local static URL security analyzer built with **Next.js (App Router, TypeScript, Tailwind CSS)** and a **Python 3.14 + FastAPI** analysis microservice in a unified repository.

LinkShield evaluates URLs safely **without visiting, fetching, or following redirects** from submitted targets.

---

## Architecture Overview

```
linkshield/
  app/                    # Next.js App Router (layout.tsx, page.tsx, globals.css)
  components/             # UrlForm, ResultPanel, FindingItem, SeverityBadge, HistoryList, ExampleChips
  lib/                    # api client, types, history (localStorage), report formatter
  api/                    # FastAPI (Python 3.14)
    index.py              # FastAPI app instance, CORS, size limits, exception handlers
    config.py             # Settings loaded from environment
    schemas.py            # Pydantic v2 data models
    routes.py             # POST /api/scan, GET /api/health
    analyzer.py           # Static URL normalization & heuristic detection rules (pure)
    scoring.py            # Single source of truth for weights, capping, and verdicts
    reputation.py         # Google Safe Browsing v4 threat lookup client
  tests/                  # Pytest test suite for api/
  package.json            # Unified scripts orchestrating both frontend and backend
  requirements.txt        # Pinned Python 3.14 dependencies
  next.config.ts          # Dev rewrite (/api/* -> http://127.0.0.1:8000/api/*)
```

---

## Core Product Rules & Methodology

1. **Heuristic Risk Score**: The score is a transparent structural and syntactic heuristic sum, never a probability of compromise. It is labeled as **"Heuristic risk score"** everywhere.
2. **Zero Remote Network Visits**: The backend engine **never visits, executes, or establishes TCP connections** to the submitted target. All evaluations are purely static parsing and an optional reputation lookup.
3. **100% Usable Offline / Without API Keys**: LinkShield functions fully with no external services or API keys required.
4. **Explicit Provider Status**: If Google Safe Browsing is unconfigured, times out, or fails, the status explicitly says `"Not checked: provider not configured"`, `"Lookup Timed Out"`, or `"Provider Error"`. Never implies a check occurred when it did not.
5. **No False Promises**: *"No issues detected"* means *"no issues detected by these static checks"*, never *"safe"*.
6. **Safety in UI**: Target URLs are rendered strictly as selectable plain text, never clickable hyperlinked tags.

---

## Scoring Rules & Thresholds (`api/scoring.py`)

All heuristic weights are centrally defined and capped at **100**:

| Rule ID | Finding Title | Severity | Score Contribution |
|---|---|---|---|
| `non_standard_ip_encoding` | Non-Standard IP Address Encoding (Hex/Octal/Integer) | High | +40 pts |
| `embedded_credentials` | Embedded Credentials in Authority (`user:pass@host`) | High | +35 pts |
| `ip_address_host` | Direct IP Address as Hostname | Medium | +35 pts |
| `brand_lookalike` | High-Profile Brand Lookalike in Subdomain/Path | High | +35 pts |
| `mixed_script_host` | Homoglyph Spoofing / Mixed Unicode Scripts | High | +25 pts |
| `punycode_host` | Internationalized Punycode Domain (`xn--`) | Medium | +25 pts |
| `unusual_port` | Non-Standard Port (Not 80 or 443) | Medium | +25 pts |
| `deceptive_at_symbol` | Deceptive `@` Symbol in Authority | Medium | +25 pts |
| `high_risk_tld` | Historically Abused Top-Level Domain (e.g. `.zip`, `.tk`) | Low | +25 pts |
| `suspicious_keyword_compound` | Security Keywords Combined with Other Risk Factors | Medium | +25 pts |
| `private_or_local_ip` | Destination in Private / Loopback IP Ranges | Medium | +20 pts |
| `excessive_subdomains` | Excessive Subdomain Depth (> 3 levels) | Low | +20 pts |
| `known_url_shortener` | Known URL Shortener (e.g. `bit.ly`, `tinyurl.com`) | Low | +20 pts |
| `heavy_percent_encoding` | Heavy Percent-Encoding / Obfuscation (> 5 encodings) | Low | +20 pts |
| `plain_http` | Unencrypted Transport (Plain HTTP) | Low | +15 pts |
| `very_long_hostname` | Unusually Long Hostname (> 50 chars) | Low | +15 pts |
| `excessive_query_params` | Excessive Query Parameters (> 8 params) | Low | +15 pts |
| `excessive_url_length` | Total URL Length Exceeds 250 characters | Low | +15 pts |
| `suspicious_keyword_alone` | Sensitive Keyword in URL Path | Low | +10 pts |
| `missing_scheme_assumed_http` | Missing Scheme (Defaulted to `http://`) | Info | +5 pts |
| `domain_resolves_private_ip` | Domain Resolves to Private / Loopback IP | Medium | +20 pts |
| `domain_not_found` | Domain Does Not Resolve (NXDOMAIN) | Info | +0 pts |

### Categorical Verdicts:
- **`0`**: `no_issues_detected`
- **`1 - 29`**: `low_risk`
- **`30 - 64`**: `suspicious`
- **`65+`**: `high_risk`
*(Any positive Google Safe Browsing match automatically triggers `high_risk`)*

---

## API Contract

### Health Check: `GET /api/health`
**Response:**
```json
{
  "status": "ok",
  "reputation_provider": "configured"
}
```

### URL Scan: `POST /api/scan`
**Request Body:**
```json
{
  "url": "http://192.168.0.1:8080/login"
}
```

**Response (200 OK):**
```json
{
  "input_url": "http://192.168.0.1:8080/login",
  "normalized_url": "http://192.168.0.1:8080/login",
  "hostname": "192.168.0.1",
  "verdict": "high_risk",
  "risk_score": 95,
  "findings": [
    {
      "id": "plain_http",
      "title": "Insecure Transport (Plain HTTP)",
      "severity": "low",
      "points": 15,
      "explanation": "The URL uses unencrypted plain HTTP instead of HTTPS..."
    },
    {
      "id": "ip_address_host",
      "title": "IP Address Used as Hostname",
      "severity": "medium",
      "points": 35,
      "explanation": "The URL targets a direct IP address rather than a registered domain..."
    },
    {
      "id": "private_or_local_ip",
      "title": "Private or Local IP Range",
      "severity": "medium",
      "points": 20,
      "explanation": "The destination address resides within private RFC 1918 space..."
    },
    {
      "id": "unusual_port",
      "title": "Non-Standard Port (8080)",
      "severity": "medium",
      "points": 25,
      "explanation": "The URL specifies custom port 8080 instead of standard web ports..."
    }
  ],
  "reputation": {
    "provider": "google_safe_browsing",
    "status": "not_configured",
    "matches": [],
    "message": "Not checked: Google Safe Browsing API key is not configured."
  },
  "domain_lookup": {
    "status": "skipped",
    "message": "Not checked (IP address)"
  },
  "scanned_at": "2026-10-13T18:25:00.000000+00:00"
}
```

---

## Setup & Running

### 1. Requirements
- Node.js 18+ (tested on Node v20)
- Python 3.14 (tested on Python 3.14.6)

### 2. Installation
```powershell
# Python virtual environment
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt

# Node dependencies
npm install
```

### 3. Environment Configuration (Optional)
Copy `.env.example` to `.env`:
```env
GOOGLE_SAFE_BROWSING_API_KEY=your_key_here
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
RATE_LIMIT_PER_MINUTE=60
```

#### Obtaining a Google Safe Browsing API Key:
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Enable the **Safe Browsing API (v4)** in APIs & Services.
4. Go to **Credentials**, click **Create Credentials** -> **API Key**.
5. Add the generated key to your `.env` file as `GOOGLE_SAFE_BROWSING_API_KEY`.

### 4. Running the Application
Start both Next.js (port 3000) and FastAPI Uvicorn (port 8000) simultaneously with one command:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Next.js automatically rewrites `/api/*` to FastAPI in dev mode.

---

## Running Verification & Tests

```powershell
# Run backend Pytest suite
npm run test

# Run frontend typecheck
npm run typecheck

# Run linter
npm run lint
```

---

---

## Features & Safe Architecture

### 1. "Ethereal Clarity" UI Design
- Pure white background (`#FFFFFF`) with zero dark mode styles.
- Soft diffused ambient light glows behind hero only, transitioning seamlessly to pure white.
- Fully accessible contrast compliant with WCAG AA (all text/background pairs ≥ 4.5:1, headings ≥ 3:1).
- Typography powered by **Plus Jakarta Sans** for UI and **JetBrains Mono** for technical URL structures.

### 2. DNS-Only Domain Lookup ("Does this site exist?")
- Asynchronous resolution using `asyncio.getaddrinfo` with an enforced 3.0-second timeout.
- Pure DNS verification: never establishes HTTP, TLS, or TCP connections to the target and never follows redirects.
- Evaluates domain existence (`resolves` vs `not_found` / NXDOMAIN), detecting private/loopback resolution risks (`domain_resolves_private_ip`).
- Skips lookups for direct IP literal targets (`skipped`).

### 3. Confirmed "Open Site" Flow
- URLs are strictly non-clickable in results views to prevent accidental navigation.
- Users can intentionally open a site via a confirmation modal (`<dialog>`).
- Focus is trapped with the Cancel button auto-focused for safety. Esc cancels immediately.
- Suspicious or high-risk URLs display high-prominence warnings and require explicit "Open anyway" confirmation.
- Opens in a new tab with `rel="noopener noreferrer nofollow"` using strictly validated `http:`/`https:` schemes.

---

## Limitations

- **Heuristic Indicators**: Heuristic scoring detects structural anomalies and syntactic deception. It can produce false positives (e.g. internal network diagnostic tools, IP addresses during local testing) and false negatives (e.g. freshly registered phishing domains hosted on standard HTTPS CDNs with no obvious lexical triggers).
- **No Remote Fetching**: LinkShield does not inspect destination HTML, JavaScript, SSL certificates, or HTTP redirect cascades.
- **Threat List Propagation Delay**: Zero-day phishing campaigns often take hours or days to appear in public reputation blocklists like Google Safe Browsing.
- **Not a Replacement for EDR / Secure Web Gateways**: LinkShield is a pre-click inspection utility, not an endpoint protection agent or active content scanner. "No issues detected" is not a guarantee of safety.

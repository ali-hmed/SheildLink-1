import abc
import httpx
from api.schemas import ReputationResult, ProviderName
from api.config import settings

class ReputationProvider(abc.ABC):
    @property
    @abc.abstractmethod
    def name(self) -> ProviderName:
        pass

    @abc.abstractmethod
    async def check_url(self, url: str, domain_status: str = "resolves") -> ReputationResult:
        pass


class GoogleSafeBrowsingProvider(ReputationProvider):
    def __init__(self, api_key: str | None = None, timeout: float = 5.0):
        self._api_key = settings.google_safe_browsing_api_key if api_key is None else api_key
        self._timeout = timeout
        self._endpoint = "https://safebrowsing.googleapis.com/v4/threatMatches:find"

    @property
    def name(self) -> ProviderName:
        return "google_safe_browsing"

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key and self._api_key.strip())

    async def check_url(self, url: str, domain_status: str = "resolves") -> ReputationResult:
        # Never show "Clean" for a domain that does not resolve; show "Skipped (domain not found)"
        if domain_status == "not_found":
            return ReputationResult(
                provider=self.name,
                status="skipped",
                matches=[],
                message="Skipped (domain not found)"
            )

        if not self.is_configured:
            return ReputationResult(
                provider=self.name,
                status="not_configured",
                matches=[],
                message="Not configured"
            )

        payload = {
            "client": {
                "clientId": "linkshield-analyzer",
                "clientVersion": "1.0.0"
            },
            "threatInfo": {
                "threatTypes": [
                    "MALWARE",
                    "SOCIAL_ENGINEERING",
                    "UNWANTED_SOFTWARE",
                    "POTENTIALLY_HARMFUL_APPLICATION"
                ],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url}]
            }
        }

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(
                    self._endpoint,
                    params={"key": self._api_key},
                    json=payload
                )

            if response.status_code == 200:
                data = response.json()
                raw_matches = data.get("matches", [])
                match_types = [m.get("threatType", "THREAT_DETECTED") for m in raw_matches if isinstance(m, dict)]

                if match_types:
                    return ReputationResult(
                        provider=self.name,
                        status="checked",
                        matches=match_types,
                        message=f"Threat detected by Google Safe Browsing: {', '.join(set(match_types))}."
                    )
                return ReputationResult(
                    provider=self.name,
                    status="checked",
                    matches=[],
                    message="No threat matches found in Google Safe Browsing lists."
                )

            return ReputationResult(
                provider=self.name,
                status="error",
                matches=[],
                message=f"Reputation lookup failed with provider status code {response.status_code}."
            )

        except httpx.TimeoutException:
            return ReputationResult(
                provider=self.name,
                status="timeout",
                matches=[],
                message="Reputation provider lookup timed out after 5.0s."
            )
        except Exception:
            return ReputationResult(
                provider=self.name,
                status="error",
                matches=[],
                message="Reputation lookup could not be completed due to a network or connection error."
            )


# Default provider instance
reputation_service = GoogleSafeBrowsingProvider()

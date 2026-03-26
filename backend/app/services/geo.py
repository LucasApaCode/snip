import httpx

from app.services.cache import get_cached_country, set_cached_country

_PRIVATE_PREFIXES = ("127.", "10.", "192.168.", "172.16.", "::1", "localhost")


def _is_private(ip: str) -> bool:
    return any(ip.startswith(p) for p in _PRIVATE_PREFIXES)


async def get_country(ip: str | None) -> str | None:
    if not ip or _is_private(ip):
        return None

    cached = await get_cached_country(ip)
    if cached is not None:
        return cached or None

    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(
                f"http://ip-api.com/json/{ip}",
                params={"fields": "status,countryCode"},
            )
            data = r.json()
    except Exception:
        return None

    country_code = data.get("countryCode", "") if data.get("status") == "success" else ""
    await set_cached_country(ip, country_code)
    return country_code or None

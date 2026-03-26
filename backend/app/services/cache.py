import json
from datetime import datetime
from typing import Optional

import redis.asyncio as aioredis

from app.config import settings

_redis: aioredis.Redis | None = None

TTL_SECONDS = 60 * 60 * 24  # 24 horas


def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _redis


async def get_cached_url(slug: str) -> Optional[dict]:
    r = get_redis()
    value = await r.get(f"slug:{slug}")
    if value is None:
        return None
    return json.loads(value)


async def set_cached_url(slug: str, original_url: str, url_id: int, expires_at: Optional[datetime] = None) -> None:
    r = get_redis()
    payload = {
        "url_id": url_id,
        "original_url": original_url,
        "expires_at": expires_at.isoformat() if expires_at else None,
    }
    await r.set(f"slug:{slug}", json.dumps(payload), ex=TTL_SECONDS)


async def delete_cached_url(slug: str) -> None:
    r = get_redis()
    await r.delete(f"slug:{slug}")


GEO_TTL = 60 * 60 * 24 * 7  # 7 días


async def get_cached_country(ip: str) -> str | None:
    r = get_redis()
    return await r.get(f"geo:{ip}")


async def set_cached_country(ip: str, country_code: str) -> None:
    r = get_redis()
    await r.set(f"geo:{ip}", country_code, ex=GEO_TTL)

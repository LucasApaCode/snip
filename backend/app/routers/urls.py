import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, HttpUrl, field_validator
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.url import URL
from app.models.user import User
from app.services.shortener import generate_unique_slug
from app.services.cache import set_cached_url, delete_cached_url
from app.services.auth import get_current_user
from app.services.limiter import limiter
from app.config import settings

router = APIRouter()

SLUG_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9\-]{1,18}[a-zA-Z0-9]$")


class ShortenRequest(BaseModel):
    url: HttpUrl
    custom_slug: str | None = None
    expires_at: Optional[datetime] = None

    @field_validator("custom_slug")
    @classmethod
    def validate_custom_slug(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v:
            return None
        if len(v) < 3 or len(v) > 20:
            raise ValueError("El slug debe tener entre 3 y 20 caracteres")
        if not SLUG_RE.match(v):
            raise ValueError(
                "El slug solo puede contener letras, números y guiones, "
                "y no puede empezar ni terminar con un guión. Máximo 20 caracteres."
            )
        return v


class ShortenResponse(BaseModel):
    slug: str
    short_url: str
    original_url: str
    expires_at: Optional[datetime] = None


@router.post("/shorten", response_model=ShortenResponse)
@limiter.limit("20/minute")
async def shorten_url(
    request: Request,
    body: ShortenRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    original_url = str(body.url)

    if body.expires_at is not None:
        # Normalizar a UTC con timezone-aware
        expires_at_utc = body.expires_at
        if expires_at_utc.tzinfo is None:
            expires_at_utc = expires_at_utc.replace(tzinfo=timezone.utc)
        if expires_at_utc <= datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="expires_at debe ser una fecha en el futuro")
    else:
        expires_at_utc = None

    if body.custom_slug:
        result = await db.execute(select(URL).where(URL.slug == body.custom_slug))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Ese slug ya está en uso")
        slug = body.custom_slug
    else:
        result = await db.execute(
            select(URL).where(URL.original_url == original_url, URL.user_id == current_user.id)
        )
        existing = result.scalar_one_or_none()
        if existing:
            return ShortenResponse(
                slug=existing.slug,
                short_url=f"{settings.base_url}/{existing.slug}",
                original_url=existing.original_url,
            )

        slug = generate_unique_slug(original_url, current_user.id)
        attempt = 0
        MAX_SLUG_ATTEMPTS = 10
        while True:
            result = await db.execute(select(URL).where(URL.slug == slug))
            if not result.scalar_one_or_none():
                break
            attempt += 1
            if attempt > MAX_SLUG_ATTEMPTS:
                raise HTTPException(status_code=500, detail="No se pudo generar un slug único")
            slug = generate_unique_slug(original_url, current_user.id, attempt)

    url_obj = URL(slug=slug, original_url=original_url, user_id=current_user.id, expires_at=expires_at_utc)
    db.add(url_obj)
    await db.commit()
    await db.refresh(url_obj)

    await set_cached_url(slug, original_url, url_obj.id, expires_at_utc)

    return ShortenResponse(
        slug=slug,
        short_url=f"{settings.base_url}/{slug}",
        original_url=original_url,
        expires_at=expires_at_utc,
    )


@router.get("/urls")
async def list_urls(
    page: int = Query(0, ge=0),
    size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_result = await db.execute(
        select(func.count()).select_from(URL).where(URL.user_id == current_user.id)
    )
    total = total_result.scalar_one()

    result = await db.execute(
        select(URL)
        .where(URL.user_id == current_user.id)
        .order_by(URL.created_at.desc())
        .offset(page * size)
        .limit(size)
    )
    urls = result.scalars().all()
    return {
        "total": total,
        "page": page,
        "size": size,
        "items": [
            {
                "slug": u.slug,
                "short_url": f"{settings.base_url}/{u.slug}",
                "original_url": u.original_url,
                "click_count": u.click_count,
                "created_at": u.created_at,
                "expires_at": u.expires_at,
            }
            for u in urls
        ],
    }


@router.delete("/urls/{slug}", status_code=204)
async def delete_url(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(URL).where(URL.slug == slug, URL.user_id == current_user.id)
    )
    url_obj = result.scalar_one_or_none()
    if not url_obj:
        raise HTTPException(status_code=404, detail="URL not found")
    await db.delete(url_obj)
    await db.commit()
    await delete_cached_url(slug)

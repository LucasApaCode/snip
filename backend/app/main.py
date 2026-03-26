from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import BackgroundTasks, FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from user_agents import parse as parse_ua

from app.config import settings
from app.database import get_db, AsyncSessionLocal
from app.models.url import URL, Visit
from app.routers import urls, analytics, auth
from app.services.cache import get_cached_url, set_cached_url, get_redis
from app.services.geo import get_country
from app.services.limiter import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_redis()
    yield


app = FastAPI(
    title="Snip API",
    description="Precision URL Shortener",
    version="0.1.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(urls.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}


async def _track_visit(
    url_id: int,
    ip: str | None,
    ua_string: str,
    referer: str | None,
    device_type: str,
    browser: str,
) -> None:
    """Background task: geolocaliza y registra la visita en una session propia."""
    try:
        country = await get_country(ip)

        async with AsyncSessionLocal() as session:
            await session.execute(
                update(URL).where(URL.id == url_id).values(click_count=URL.click_count + 1)
            )
            session.add(Visit(
                url_id=url_id,
                ip_address=ip,
                user_agent=ua_string,
                referer=referer,
                device_type=device_type,
                browser=browser,
                country=country,
            ))
            await session.commit()
    except Exception:
        import logging
        logging.getLogger(__name__).exception("Error tracking visit for url_id=%s", url_id)


@app.get("/{slug}")
@limiter.limit("300/minute")
async def redirect_url(
    slug: str,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    cached = await get_cached_url(slug)

    if cached is not None:
        cached_expires_at = cached.get("expires_at")
        if cached_expires_at:
            expires_dt = datetime.fromisoformat(cached_expires_at)
            if expires_dt <= datetime.now(timezone.utc):
                raise HTTPException(status_code=410, detail="This link has expired")
        original_url = cached["original_url"]
        url_id = cached["url_id"]
    else:
        result = await db.execute(select(URL).where(URL.slug == slug))
        url_obj = result.scalar_one_or_none()
        if not url_obj:
            raise HTTPException(status_code=404, detail="Slug not found")
        if url_obj.expires_at is not None:
            expires_at_utc = url_obj.expires_at
            if expires_at_utc.tzinfo is None:
                expires_at_utc = expires_at_utc.replace(tzinfo=timezone.utc)
            if expires_at_utc <= datetime.now(timezone.utc):
                raise HTTPException(status_code=410, detail="This link has expired")
        original_url = url_obj.original_url
        url_id = url_obj.id
        await set_cached_url(slug, original_url, url_id, url_obj.expires_at)

    ip = request.client.host if request.client else None
    ua_string = request.headers.get("user-agent", "")
    if ua_string:
        ua = parse_ua(ua_string)
        device_type = (
            "Bot" if ua.is_bot
            else "Mobile" if ua.is_mobile
            else "Tablet" if ua.is_tablet
            else "PC"
        )
        browser = ua.browser.family or "Other"
    else:
        device_type = "Unknown"
        browser = "Unknown"

    background_tasks.add_task(
        _track_visit,
        url_id=url_id,
        ip=ip,
        ua_string=ua_string,
        referer=request.headers.get("referer"),
        device_type=device_type,
        browser=browser,
    )

    return RedirectResponse(url=original_url, status_code=302)

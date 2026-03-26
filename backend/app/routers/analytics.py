from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.url import URL, Visit
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/analytics")


@router.get("/{slug}")
async def get_analytics(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(URL).where(URL.slug == slug, URL.user_id == current_user.id)
    )
    url_obj = result.scalar_one_or_none()
    if not url_obj:
        raise HTTPException(status_code=404, detail="Slug not found")

    visits_by_day = await db.execute(
        select(
            func.date(Visit.visited_at).label("day"),
            func.count(Visit.id).label("count"),
        )
        .where(Visit.url_id == url_obj.id)
        .group_by(func.date(Visit.visited_at))
        .order_by(func.date(Visit.visited_at))
    )

    top_referers = await db.execute(
        select(Visit.referer, func.count(Visit.id).label("count"))
        .where(Visit.url_id == url_obj.id)
        .group_by(Visit.referer)
        .order_by(func.count(Visit.id).desc())
        .limit(10)
    )

    top_devices = await db.execute(
        select(Visit.device_type, func.count(Visit.id).label("count"))
        .where(Visit.url_id == url_obj.id, Visit.device_type.isnot(None))
        .group_by(Visit.device_type)
        .order_by(func.count(Visit.id).desc())
    )

    top_browsers = await db.execute(
        select(Visit.browser, func.count(Visit.id).label("count"))
        .where(Visit.url_id == url_obj.id, Visit.browser.isnot(None))
        .group_by(Visit.browser)
        .order_by(func.count(Visit.id).desc())
        .limit(8)
    )

    top_countries = await db.execute(
        select(Visit.country, func.count(Visit.id).label("count"))
        .where(Visit.url_id == url_obj.id, Visit.country.isnot(None))
        .group_by(Visit.country)
        .order_by(func.count(Visit.id).desc())
        .limit(10)
    )

    return {
        "slug": url_obj.slug,
        "original_url": url_obj.original_url,
        "total_clicks": url_obj.click_count,
        "created_at": url_obj.created_at,
        "visits_by_day": [
            {"day": str(row.day), "count": row.count}
            for row in visits_by_day
        ],
        "top_referers": [
            {"referer": row.referer or "Direct", "count": row.count}
            for row in top_referers
        ],
        "top_devices": [
            {"device_type": row.device_type, "count": row.count}
            for row in top_devices
        ],
        "top_browsers": [
            {"browser": row.browser, "count": row.count}
            for row in top_browsers
        ],
        "top_countries": [
            {"country_code": row.country, "count": row.count}
            for row in top_countries
        ],
    }

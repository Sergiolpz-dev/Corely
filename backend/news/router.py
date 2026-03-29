from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import httpx

from config import settings
from auth.dependencies import get_current_user
from models.user import User

router = APIRouter(prefix="/news", tags=["News"])

NEWS_API_BASE = "https://newsapi.org/v2"


@router.get("/top-headlines")
async def get_top_headlines(
    category: Optional[str] = Query(None, description="business|entertainment|general|health|science|sports|technology"),
    country: str = Query("es", description="Código de país (es, us, gb, fr, de, it)"),
    q: Optional[str] = Query(None, description="Palabras clave"),
    page_size: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    current_user: User = Depends(get_current_user),
):
    """Proxy a NewsAPI /top-headlines. Requiere autenticación."""
    if not settings.NEWS_API_KEY:
        raise HTTPException(status_code=503, detail="NEWS_API_KEY no configurada en el servidor")

    params: dict = {
        "apiKey": settings.NEWS_API_KEY,
        "country": country,
        "pageSize": page_size,
        "page": page,
    }
    if category:
        params["category"] = category
    if q:
        params["q"] = q

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(f"{NEWS_API_BASE}/top-headlines", params=params)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("message", "Error al contactar NewsAPI"))

    return response.json()


@router.get("/search")
async def search_news(
    q: str = Query(..., description="Palabras clave (requerido)"),
    language: str = Query("es", description="Código de idioma: es, en, fr, de, it, pt"),
    sort_by: str = Query("publishedAt", description="publishedAt | relevancy | popularity"),
    from_date: Optional[str] = Query(None, description="Fecha inicio ISO (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="Fecha fin ISO (YYYY-MM-DD)"),
    page_size: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    current_user: User = Depends(get_current_user),
):
    """Proxy a NewsAPI /everything. Requiere autenticación."""
    if not settings.NEWS_API_KEY:
        raise HTTPException(status_code=503, detail="NEWS_API_KEY no configurada en el servidor")

    params: dict = {
        "apiKey": settings.NEWS_API_KEY,
        "q": q,
        "language": language,
        "sortBy": sort_by,
        "pageSize": page_size,
        "page": page,
    }
    if from_date:
        params["from"] = from_date
    if to_date:
        params["to"] = to_date

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(f"{NEWS_API_BASE}/everything", params=params)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.json().get("message", "Error al contactar NewsAPI"))

    return response.json()

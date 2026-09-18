"""Общий HTTP-клиент для Tatsoft."""

from __future__ import annotations

import httpx
from fastapi import HTTPException

from config import settings


def tatsoft_client() -> httpx.AsyncClient:
    if not settings.tatsoft_base_url or not settings.tatsoft_api_key:
        raise HTTPException(
            status_code=503,
            detail="Tatsoft не настроен: задай TATSOFT_BASE_URL и TATSOFT_API_KEY в backend/.env",
        )
    return httpx.AsyncClient(
        base_url=settings.tatsoft_base_url.rstrip("/"),
        headers={"Authorization": f"Bearer {settings.tatsoft_api_key}"},
        timeout=30,
    )


async def tatsoft_post(client: httpx.AsyncClient, path: str, **kwargs) -> httpx.Response:
    try:
        resp = await client.post(path, **kwargs)
        resp.raise_for_status()
        return resp
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Tatsoft недоступен: {exc}")

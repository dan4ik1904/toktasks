"""Общий HTTP-клиент для Tatsoft (публичные ручки, ключ не нужен)."""

from __future__ import annotations

import httpx
from fastapi import HTTPException


def tatsoft_client(base_url: str) -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url=base_url.rstrip("/"), timeout=30)


async def tatsoft_get(client: httpx.AsyncClient, path: str, **kwargs) -> httpx.Response:
    try:
        resp = await client.get(path, **kwargs)
        resp.raise_for_status()
        return resp
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Tatsoft недоступен: {exc}")


async def tatsoft_post(client: httpx.AsyncClient, path: str, **kwargs) -> httpx.Response:
    try:
        resp = await client.post(path, **kwargs)
        resp.raise_for_status()
        return resp
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Tatsoft недоступен: {exc}")

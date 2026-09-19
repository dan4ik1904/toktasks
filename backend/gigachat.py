"""GigaChat OAuth2 клиент — автоматическое обновление токена.

GigaChat API использует OAuth2: client_id + client_secret → access_token.
Токен живёт 30 минут, обновляется автоматически.
"""

from __future__ import annotations

import time
import httpx

from config import settings


class GigaChatClient:
    def __init__(self) -> None:
        self._token: str | None = None
        self._expires_at: float = 0.0

    @property
    def auth_url(self) -> str:
        return "https://ngs.sber.ru/auth/realms/angle-realm/protocol/openid-connect/token"

    async def _refresh_token(self) -> str:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                self.auth_url,
                data={
                    "grant_type": "client_credentials",
                    "client_id": settings.gigachat_client_id,
                    "client_secret": settings.gigachat_client_secret,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            resp.raise_for_status()
            data = resp.json()
            self._token = data["access_token"]
            self._expires_at = time.time() + data.get("expires_in", 1800) - 60
            return self._token

    async def get_token(self) -> str:
        if self._token and time.time() < self._expires_at:
            return self._token
        return await self._refresh_token()

    async def chat(self, messages: list[dict], model: str = "", temperature: float = 0.7, max_tokens: int = 500) -> str:
        token = await self.get_token()
        url = settings.gigachat_base_url.rstrip("/") + "/chat/completions"
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                url,
                headers={"Authorization": f"Bearer {token}"},
                json={
                    "model": model or settings.gigachat_model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]


gigachat = GigaChatClient()

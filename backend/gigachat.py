"""GigaChat OAuth2 клиент — автоматическое обновление токена.

GigaChat API использует Authorization Key (Base64) → access_token.
Токен живёт 30 минут, обновляется автоматически.
Для работы требуются сертификаты НУЦ Минцифры.
"""

from __future__ import annotations

import ssl
import time
import uuid

import httpx

from config import settings


def _make_ssl_context() -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    try:
        ctx.load_verify_locations("/usr/local/share/ca-certificates/russian_trusted_root_ca_pem.crt")
    except Exception:
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
    return ctx


SSL_CTX = _make_ssl_context()


class GigaChatClient:
    def __init__(self) -> None:
        self._token: str | None = None
        self._expires_at: float = 0.0

    async def _refresh_token(self) -> str:
        auth_key = settings.gigachat_auth_key
        if not auth_key:
            raise RuntimeError("GIGACHAT_AUTH_KEY не задан в .env")

        async with httpx.AsyncClient(timeout=10, verify=SSL_CTX) as client:
            resp = await client.post(
                "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                    "RqUID": str(uuid.uuid4()),
                    "Authorization": f"Basic {auth_key}",
                },
                data={"scope": "GIGACHAT_API_PERS"},
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

    async def chat(
        self,
        messages: list[dict],
        model: str = "",
        temperature: float = 0.7,
        max_tokens: int = 500,
    ) -> str:
        token = await self.get_token()
        url = settings.gigachat_base_url.rstrip("/") + "/chat/completions"
        async with httpx.AsyncClient(timeout=30, verify=SSL_CTX) as client:
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

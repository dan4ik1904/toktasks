"""Проверка initData Telegram Web App."""

from __future__ import annotations

import hashlib
import hmac
import json
from urllib.parse import parse_qsl

from fastapi import Header, HTTPException

from config import settings


def verify_init_data(init_data: str) -> dict | None:
    """Возвращает user-dict из initData либо None, если подпись неверна."""
    if not settings.bot_token or not init_data:
        return None
    try:
        pairs = dict(parse_qsl(init_data, keep_blank_values=True))
        received_hash = pairs.pop("hash", "")
        check_string = "\n".join(f"{k}={pairs[k]}" for k in sorted(pairs))
        secret = hmac.new(b"WebAppData", settings.bot_token.encode(), hashlib.sha256).digest()
        calc = hmac.new(secret, check_string.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(calc, received_hash):
            return None
        return json.loads(pairs.get("user", "{}"))
    except Exception:
        return None


async def telegram_user(
    x_telegram_init_data: str | None = Header(default=None),
) -> dict | None:
    """Зависимость FastAPI: пользователь из заголовка X-Telegram-Init-Data.

    Если BOT_TOKEN не задан — проверка пропускается (dev-режим),
    возвращается None. Строгая валидация включается сама, как только
    в .env появляется токен.
    """
    if not x_telegram_init_data:
        return None
    if not settings.bot_token:
        try:
            pairs = dict(parse_qsl(x_telegram_init_data, keep_blank_values=True))
            return json.loads(pairs.get("user", "{}")) or None
        except Exception:
            return None
    user = verify_init_data(x_telegram_init_data)
    if user is None:
        raise HTTPException(status_code=401, detail="invalid telegram initData")
    return user

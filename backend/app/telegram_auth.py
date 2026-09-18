"""Проверка initData Telegram Web App (опционально для будущих ручек)."""

from __future__ import annotations

import hashlib
import hmac
import json
from urllib.parse import parse_qsl

from .config import settings


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

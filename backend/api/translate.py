"""POST /api/translate — перевод ru<->tt через Tatsoft.

Tatsoft: GET /translate?lang=0&text=... (0: ru->tt, 1: tt->ru).
Фраза -> plain text; отдельное слово -> XML, перевод берём из <mt>.
При недоступности сети — встроенный словарь островов.
"""

import re
import xml.etree.ElementTree as ET

from fastapi import APIRouter
from pydantic import BaseModel

from api._client import tatsoft_client, tatsoft_get
from config import settings
from island_logic import _norm, vocabulary

router = APIRouter()

_VOCAB = vocabulary()
_RU_TO_TT = {_norm(v): k for k, v in _VOCAB.items()}


class TranslateRequest(BaseModel):
    text: str
    src: str = "ru"
    dst: str = "tt"


class TranslateResponse(BaseModel):
    translation: str
    source: str  # "tatsoft" | "offline"


def _parse_tatsoft(body: str) -> str:
    body = body.strip()
    if body.startswith("<"):
        root = ET.fromstring(body)
        mt = root.findtext("mt")
        if mt:
            return mt.strip()
    return body


def offline_translate(text: str, src: str, dst: str) -> str | None:
    key = _norm(text)
    if src == "ru" and dst == "tt":
        return _RU_TO_TT.get(key)
    if src == "tt" and dst == "ru":
        return _VOCAB.get(key)
    return None


@router.post("/api/translate", response_model=TranslateResponse)
async def translate(req: TranslateRequest) -> TranslateResponse:
    text = req.text.strip()
    if not text:
        return TranslateResponse(translation="", source="offline")
    lang = "0" if (req.src == "ru" and req.dst == "tt") else "1"
    try:
        async with tatsoft_client(settings.tatsoft_translate_base) as client:
            resp = await tatsoft_get(
                client, "/translate", params={"lang": lang, "text": text}
            )
        return TranslateResponse(translation=_parse_tatsoft(resp.text), source="tatsoft")
    except Exception:
        hit = offline_translate(text, req.src, req.dst)
        return TranslateResponse(
            translation=hit or f"(офлайн: «{text}» нет в словаре островов)",
            source="offline",
        )

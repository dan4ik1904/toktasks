"""POST /api/translate — перевод ru<->tt.

Сначала Tatsoft, без ключей — встроенный словарь островов
(точные совпадения слов, регистронезависимо).
"""

from fastapi import APIRouter
from pydantic import BaseModel

from api._client import tatsoft_client, tatsoft_post
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
    if settings.tatsoft_base_url and settings.tatsoft_api_key:
        async with tatsoft_client() as client:
            resp = await tatsoft_post(
                client,
                settings.tatsoft_translate_path,
                json={"text": text, "src": req.src, "dst": req.dst},
            )
        data = resp.json()
        return TranslateResponse(
            translation=str(data.get("translation", "")), source="tatsoft"
        )
    hit = offline_translate(text, req.src, req.dst)
    return TranslateResponse(
        translation=hit or f"(офлайн: «{text}» нет в словаре островов)",
        source="offline",
    )

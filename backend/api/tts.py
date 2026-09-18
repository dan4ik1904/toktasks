"""POST /api/tts — озвучка татарского текста (Tatsoft TTS).

Tatsoft: GET /listening/?speaker=alsu&text=... -> {wav_base64, sample_rate}.
Отдаём фронту готовый audio/wav.
"""

import base64

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from api._client import tatsoft_client, tatsoft_get
from config import settings

router = APIRouter()


class TtsRequest(BaseModel):
    text: str
    voice: str = ""


@router.post("/api/tts")
async def tts(req: TtsRequest) -> Response:
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="пустой текст")
    speaker = req.voice or settings.tatsoft_tts_speaker
    params = {"speaker": speaker, "text": text}
    if settings.tatsoft_api_key:
        params["token"] = settings.tatsoft_api_key
    async with tatsoft_client(settings.tatsoft_tts_base) as client:
        resp = await tatsoft_get(client, "/listening/", params=params)
    try:
        wav = base64.b64decode(resp.json()["wav_base64"])
    except Exception:
        raise HTTPException(status_code=502, detail="неожиданный ответ Tatsoft TTS")
    return Response(content=wav, media_type="audio/wav")

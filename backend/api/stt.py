"""POST /api/stt — распознавание татарской речи (Tatsoft ASR).

Tatsoft: POST /listening/ files={file: wav} -> {text} | {r:[{response:[{text}]}]}.
"""

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from api._client import tatsoft_client, tatsoft_post
from config import settings

router = APIRouter()


class SttResponse(BaseModel):
    text: str


def _extract_text(data: dict) -> str | None:
    if isinstance(data.get("text"), str):
        return data["text"]
    if isinstance(data.get("text"), dict) and isinstance(data["text"].get("text"), str):
        return data["text"]["text"]
    try:
        return str(data["r"][0]["response"][0]["text"])
    except Exception:
        return None


@router.post("/api/stt", response_model=SttResponse)
async def stt(audio: UploadFile = File(...)) -> SttResponse:
    raw = await audio.read()
    if not raw:
        raise HTTPException(status_code=400, detail="пустой файл")
    async with tatsoft_client(settings.tatsoft_stt_base) as client:
        resp = await tatsoft_post(
            client,
            "/listening/",
            files={"file": (audio.filename or "audio.wav", raw, "audio/wav")},
        )
    try:
        text = _extract_text(resp.json())
    except Exception:
        text = None
    if not text:
        raise HTTPException(status_code=502, detail="Tatsoft не распознал речь")
    return SttResponse(text=text)

"""POST /api/stt — распознавание татарской речи (Tatsoft STT)."""

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from api._client import tatsoft_client, tatsoft_post
from config import settings

router = APIRouter()


class SttResponse(BaseModel):
    text: str


@router.post("/api/stt", response_model=SttResponse)
async def stt(audio: UploadFile = File(...), lang: str = "tt") -> SttResponse:
    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="нужен аудиофайл")
    raw = await audio.read()
    if not raw:
        raise HTTPException(status_code=400, detail="пустой файл")
    async with tatsoft_client() as client:
        resp = await tatsoft_post(
            client,
            settings.tatsoft_stt_path,
            files={"audio": (audio.filename or "audio", raw, audio.content_type)},
            data={"lang": lang},
        )
    data = resp.json()
    text = data.get("text", "")
    if not isinstance(text, str):
        raise HTTPException(status_code=502, detail="неожиданный ответ Tatsoft STT")
    return SttResponse(text=text)

"""POST /api/tts — озвучка татарского текста (Tatsoft TTS)."""

from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel

from api._client import tatsoft_client, tatsoft_post
from config import settings

router = APIRouter()


class TtsRequest(BaseModel):
    text: str
    voice: str = "tatar-female"


@router.post("/api/tts")
async def tts(req: TtsRequest) -> Response:
    text = req.text.strip()
    if not text:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail="пустой текст")
    async with tatsoft_client() as client:
        resp = await tatsoft_post(
            client,
            settings.tatsoft_tts_path,
            json={"text": text, "voice": req.voice},
        )
    ctype = resp.headers.get("content-type", "audio/mpeg")
    return Response(content=resp.content, media_type=ctype)

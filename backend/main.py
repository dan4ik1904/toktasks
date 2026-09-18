"""Точка входа: uvicorn main:app --reload (запуск из backend/)."""

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from api import stt, translate, tts
from assistant import ask_assistant, grade_pronunciation, probe_llm
from auth import telegram_user
from config import settings
from island_logic import (
    check_answer,
    get_island,
    get_progress,
    islands_index,
    save_progress,
)

app = FastAPI(title="Татар.Уку API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stt.router)
app.include_router(tts.router)
app.include_router(translate.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "tatar-uku"}


@app.get("/api/islands")
def api_islands() -> list[dict]:
    return islands_index()


@app.get("/api/island/{slug}")
def api_island(slug: str) -> dict:
    island = get_island(slug)
    if island is None:
        raise HTTPException(status_code=404, detail="остров не найден")
    return island


class CheckRequest(BaseModel):
    expected: str
    heard: str


@app.post("/api/check")
def api_check(req: CheckRequest) -> dict:
    return check_answer(req.expected, req.heard)


class GradeRequest(BaseModel):
    expected: str
    heard: str


@app.post("/api/grade")
async def api_grade(req: GradeRequest) -> dict:
    """Строгий судья: LLM (Ollama), иначе Левенштейн. Всегда 200 + source."""
    return await grade_pronunciation(req.expected, req.heard)


@app.on_event("startup")
async def _startup() -> None:
    await probe_llm()


class ProgressRequest(BaseModel):
    island_slug: str
    lesson_id: str


@app.post("/api/progress")
def api_progress(req: ProgressRequest, user: dict | None = Depends(telegram_user)) -> dict:
    user_id = str((user or {}).get("id", "demo"))
    try:
        return save_progress(user_id, req.island_slug, req.lesson_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/progress")
def api_get_progress(user_id: str = "demo") -> dict:
    return get_progress(user_id)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@app.post("/api/assistant/chat", response_model=ChatResponse)
async def assistant_chat(req: ChatRequest) -> ChatResponse:
    return ChatResponse(reply=await ask_assistant(req.message))

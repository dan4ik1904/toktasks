"""Точка входа: uvicorn main:app --reload (запуск из backend/)."""

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from api import stt, translate, tts
from assistant import ask_assistant, grade_pronunciation, probe_llm
from auth import telegram_user
from config import settings
from island_logic import check_answer, get_island, islands_index
import db as store

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
    store.init_db()
    await probe_llm()


class ProgressRequest(BaseModel):
    island_slug: str
    lesson_id: str
    user_id: str = "demo"


class RegisterRequest(BaseModel):
    tg_id: str = "demo"
    first_name: str = ""
    username: str = ""


def _uid(user: dict | None, fallback: str) -> str:
    if user and user.get("id"):
        return str(user["id"])
    return fallback or "demo"


@app.post("/api/register")
def api_register(req: RegisterRequest, user: dict | None = Depends(telegram_user)) -> dict:
    return store.register(_uid(user, req.tg_id), req.first_name, req.username)


@app.get("/api/me")
def api_me(user_id: str = "demo", user: dict | None = Depends(telegram_user)) -> dict:
    return store.me(_uid(user, user_id))


@app.get("/api/leaderboard")
def api_leaderboard(limit: int = 20) -> list[dict]:
    return store.leaderboard(max(1, min(limit, 50)))


@app.post("/api/progress")
def api_progress(req: ProgressRequest, user: dict | None = Depends(telegram_user)) -> dict:
    uid = _uid(user, req.user_id)
    if get_island(req.island_slug) is None:
        raise HTTPException(status_code=400, detail="unknown island")
    return store.complete_lesson(uid, req.lesson_id)


@app.get("/api/progress")
def api_get_progress(user_id: str = "demo", user: dict | None = Depends(telegram_user)) -> dict:
    return store.me(_uid(user, user_id))


@app.post("/api/hearts/spend")
def api_hearts_spend(user_id: str = "demo", user: dict | None = Depends(telegram_user)) -> dict:
    return store.spend_heart(_uid(user, user_id))


@app.post("/api/hearts/refill")
def api_hearts_refill(user_id: str = "demo", user: dict | None = Depends(telegram_user)) -> dict:
    return store.refill_hearts(_uid(user, user_id))


class ChatMsg(BaseModel):
    role: str = "user"
    text: str = ""


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMsg] = []


class ChatResponse(BaseModel):
    reply: str
    say: str = ""
    lang: str = "ru"


@app.post("/api/assistant/chat", response_model=ChatResponse)
async def assistant_chat(req: ChatRequest) -> ChatResponse:
    hist = [{"role": h.role, "text": h.text} for h in req.history]
    ans = await ask_assistant(req.message, hist)
    return ChatResponse(reply=ans["reply"], say=ans.get("say", ""), lang=ans.get("lang", "ru"))

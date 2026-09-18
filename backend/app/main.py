"""FastAPI-бэкенд «Татар.Уку»: health, острова, ИИ-помощник."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .assistant import ask_assistant
from .config import settings

app = FastAPI(title="Татар.Уку API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


ISLANDS_INDEX = [
    {"slug": "salem", "title": "Сәлам", "title_ru": "Приветствия"},
    {"slug": "sannar", "title": "Саннар", "title_ru": "Числа"},
    {"slug": "gaila", "title": "Гаилә", "title_ru": "Семья"},
    {"slug": "ashamlyk", "title": "Ашамлыклар", "title_ru": "Еда"},
    {"slug": "tabigat", "title": "Табигать", "title_ru": "Природа"},
    {"slug": "sayahet", "title": "Сәяхәт", "title_ru": "Путешествие"},
]


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "tatar-uku"}


@app.get("/api/islands")
def islands() -> list[dict]:
    return ISLANDS_INDEX


@app.post("/api/assistant/chat", response_model=ChatResponse)
async def assistant_chat(req: ChatRequest) -> ChatResponse:
    return ChatResponse(reply=await ask_assistant(req.message))

"""Точка входа: uvicorn main:app --reload (запуск из backend/)."""

import base64
from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from api import stt, translate, tts
from assistant import ask_assistant, grade_pronunciation, probe_llm
from auth import telegram_user
from config import settings
from gigachat import gigachat
from island_logic import check_answer, get_island, islands_index
import db as store

app = FastAPI(title="Татар.Уку API", version="0.4.0")

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


@app.get("/api/stats")
def api_stats() -> dict:
    return store.stats()


@app.get("/api/user/stats")
def api_user_stats(user_id: str = "demo", user: dict | None = Depends(telegram_user)) -> dict:
    return store.user_stats(_uid(user, user_id))


# --- Голосовой чат с котом: STT → GigaChat → TTS ---

CAT_SYSTEM = (
    "Син Татар Кот — дәү татар кәтәве! Син татар телендә яшиһән, татарча сөйләшәһән. "
    "Син дустлык, кызык һәм ярдәмче. "
    "Отвечай ТОЛЬКО ПО-ТАТАРСКИ (1-2 коротких предложения). Не переводи на русский. "
    "Говори просто, дружелюбно, как кот-друг. Исправляй ошибки мягко на татарском. "
    "СТРОГИЙ ФОРМАТ: отвечай ТОЛЬКО JSON: "
    '{"tt": "ответ ПО-ТАТАРСКИ (1-2 предложения)", "mood": "happy|thinking|playful|sleeping"}. '
    "Никакого русского и английского в поле tt. Только татарский!"
)


class CatChatResponse(BaseModel):
    reply: str
    say: str = ""
    text: str = ""
    mood: str = "happy"


@app.post("/api/cat/chat", response_model=CatChatResponse)
async def cat_voice_chat(audio: UploadFile = File(...)) -> CatChatResponse:
    raw = await audio.read()
    if not raw:
        raise HTTPException(status_code=400, detail="пустой файл")

    from api._client import tatsoft_client, tatsoft_post

    async with tatsoft_client(settings.tatsoft_stt_base) as client:
        resp = await tatsoft_post(
            client,
            "/listening/",
            files={"file": (audio.filename or "audio.wav", raw, "audio/wav")},
        )
    try:
        data = resp.json()
        if isinstance(data.get("text"), str):
            text = data["text"]
        elif isinstance(data.get("text"), dict):
            text = data["text"].get("text", "")
        else:
            text = str(data["r"][0]["response"][0]["text"])
    except Exception:
        raise HTTPException(status_code=502, detail="Tatsoft не распознал речь")

    if not text.strip():
        return CatChatResponse(reply="Мяв? Я не расслышал...", say="", text="", mood="thinking")

    try:
        result = await gigachat.chat(
            messages=[
                {"role": "system", "content": CAT_SYSTEM},
                {"role": "user", "content": text},
            ],
            temperature=0.8,
            max_tokens=200,
        )
        import json
        start, end = result.find("{"), result.rfind("}")
        cat_data = json.loads(result[start : end + 1])
        tt = str(cat_data.get("tt", "")).strip()
        mood = str(cat_data.get("mood", "happy")).strip()
        reply = tt
    except Exception:
        tt = "Мяв! Кот не может ответить"
        mood = "thinking"
        reply = tt

    return CatChatResponse(reply=reply, say=tt, text=text, mood=mood)


@app.post("/api/cat/tts")
async def cat_tts(text: str = "") -> Response:
    if not text.strip():
        raise HTTPException(status_code=400, detail="пустой текст")
    from api._client import tatsoft_client, tatsoft_get

    params = {"speaker": "almaz", "text": text}
    if settings.tatsoft_api_key:
        params["token"] = settings.tatsoft_api_key
    async with tatsoft_client(settings.tatsoft_tts_base) as client:
        resp = await tatsoft_get(client, "/listening/", params=params)
    try:
        wav = base64.b64decode(resp.json()["wav_base64"])
    except Exception:
        raise HTTPException(status_code=502, detail="Tatsoft TTS недоступен")
    return Response(content=wav, media_type="audio/wav")


# --- Speak task: LLM-коррекция произношения ---

SPEAK_GRADE_SYSTEM = (
    "Син — татар теле укытучысы. Укучы произнёс фразу. "
    "ЭТАЛОН: правильная фраза. УСЛЫШАНО: что сказал ученик. "
    "Отвечай СТРОГО JSON без пояснений: "
    '{"correct": bool, "score": 0-100, "hint_tt": "подсказка ПО-ТАТАРСКИ", '
    '"hint_ru": "подсказка ПО-РУССКИ", "syllables": ["слоги эталона"], '
    '"say_this": "эталон целиком", "mood": "happy|thinking|playful"}. '
    "Прощай мелкие огрехи (регистр, пунктуация). "
    "Если услышанное близко к эталону — correct=true. "
    "score — процент совпадения (0-100)."
)


class SpeakCheckRequest(BaseModel):
    expected: str
    audio_base64: str = ""
    heard: str = ""


class SpeakCheckResponse(BaseModel):
    correct: bool = False
    score: int = 0
    hint_tt: str = ""
    hint_ru: str = ""
    syllables: list[str] = []
    say_this: str = ""
    source: str = "offline"


@app.post("/api/task/speak", response_model=SpeakCheckResponse)
async def check_speak_task(req: SpeakCheckRequest) -> SpeakCheckResponse:
    if not req.heard.strip():
        return SpeakCheckResponse(hint_tt="Тыңла һәм кабатла!", hint_ru="Послушай и повтори!")

    if settings.gigachat_auth_key:
        try:
            result = await gigachat.chat(
                messages=[
                    {"role": "system", "content": SPEAK_GRADE_SYSTEM},
                    {"role": "user", "content": f"ЭТАЛОН: {req.expected}\nУСЛЫШАНО: {req.heard}"},
                ],
                temperature=0.2,
                max_tokens=300,
            )
            import json
            start, end = result.find("{"), result.rfind("}")
            data = json.loads(result[start : end + 1])
            from assistant import split_syllables
            return SpeakCheckResponse(
                correct=bool(data.get("correct", False)),
                score=int(data.get("score", 0)),
                hint_tt=str(data.get("hint_tt", "Тыңла һәм кабатла.")),
                hint_ru=str(data.get("hint_ru", "Послушай и повтори.")),
                syllables=list(data.get("syllables", split_syllables(req.expected))),
                say_this=str(data.get("say_this", req.expected)),
                source="gigachat",
            )
        except Exception:
            pass

    grade = await grade_pronunciation(req.expected, req.heard)
    return SpeakCheckResponse(
        correct=grade.get("correct", False),
        score=100 if grade.get("correct") else 30,
        hint_tt=grade.get("hint_tt", ""),
        hint_ru=grade.get("hint_ru", ""),
        syllables=grade.get("syllables", []),
        say_this=grade.get("say_this", req.expected),
        source=grade.get("source", "offline"),
    )

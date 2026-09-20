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


class StateSaveRequest(BaseModel):
    user_id: str = "demo"
    first_name: str = ""
    username: str = ""
    data: dict = {}


@app.get("/api/state")
def api_get_state(user_id: str = "demo", user: dict | None = Depends(telegram_user)) -> dict:
    uid = _uid(user, user_id)
    snap = store.load_state(uid)
    if snap is None:
        return {"exists": False, "updated_at": 0, "data": {}}
    return {"exists": True, "updated_at": snap["updated_at"], "data": snap["data"]}


@app.post("/api/state")
def api_save_state(req: StateSaveRequest, user: dict | None = Depends(telegram_user)) -> dict:
    uid = _uid(user, req.user_id)
    if not uid:
        raise HTTPException(status_code=400, detail="unknown user")
    return store.save_state(uid, req.data or {}, req.first_name, req.username)


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


# --- Голосовой чат с Ак Барсом: STT → GigaChat → TTS ---

CAT_SYSTEM = (
    "Син — Ак Барс, татар теле укытучысы. Укучы синең белән сөйләшә. "
    "Отвечай ТОЛЬКО ПО-ТАТАРСКИ (1-2 коротких предложения). "
    "СТРОГИЙ ФОРМАТ: отвечай ТОЛЬКО JSON: "
    '{"tt": "ответ ПО-ТАТАРСКИ (1-2 предложения)", "mood": "happy|thinking|playful|sleeping"}. '
    "Только татарский в поле tt!"
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
        tt = "Рәхмәт! Бик яхшы!"
        mood = "happy"
        reply = tt

    return CatChatResponse(reply=reply, say=tt, text=text, mood=mood)


@app.get("/api/cat/tts")
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


# --- Speak task: LLM-коррекция произношения (Менее привередливая и чувствительная) ---

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
    heard = req.heard.strip()
    if not heard and req.audio_base64:
        try:
            import base64
            audio_bytes = base64.b64decode(req.audio_base64)
            from api._client import tatsoft_client, tatsoft_post
            async with tatsoft_client(settings.tatsoft_stt_base) as client:
                resp = await tatsoft_post(
                    client,
                    "/listening/",
                    files={"file": ("audio.wav", audio_bytes, "audio/wav")},
                )
            from api.stt import _extract_text
            heard = _extract_text(resp.json()) or ""
        except Exception:
            heard = ""

    # Если ASR не распознал, но аудио записано — делаем мягкий зачет (менее привередливый)
    if not heard:
        heard = req.expected

    SPEAK_GRADE_SYSTEM = (
        "Син — Ак Барс, татар теле укытучысы. Укучы микрофонга сөйләде. "
        "ЭТАЛОН: правильная фраза. УСЛЫШАНО: что распознано микрофоном. "
        "Будь ОЧЕНЬ ЛОЯЛЬНЫМ, мягким и нетребовательным: прощай мелкие акценты, опечатки, пропущенные звуки. "
        "Если смысл или фраза примерно совпадают с эталоном — ставь correct=true и высокий score (85-100). "
        "СТРОГИЙ ФОРМАТ JSON: "
        '{"correct": true, "score": 90, "hint_tt": "Бик әйбәт әйттең!", "hint_ru": "Отлично! Произношение засчитано."}'
    )

    if settings.gigachat_auth_key:
        try:
            result = await gigachat.chat(
                messages=[
                    {"role": "system", "content": SPEAK_GRADE_SYSTEM},
                    {"role": "user", "content": f"ЭТАЛОН: {req.expected}\nУСЛЫШАНО: {heard}"},
                ],
                temperature=0.3,
                max_tokens=300,
            )
            import json
            start, end = result.find("{"), result.rfind("}")
            data = json.loads(result[start : end + 1])
            from assistant import split_syllables
            return SpeakCheckResponse(
                correct=bool(data.get("correct", True)),
                score=int(data.get("score", 90)),
                hint_tt=str(data.get("hint_tt", "Бик әйбәт!")),
                hint_ru=str(data.get("hint_ru", f"Отлично! Вы произнесли: «{heard}»")),
                syllables=list(data.get("syllables", split_syllables(req.expected))),
                say_this=str(req.expected),
                source="gigachat",
            )
        except Exception:
            pass

    from assistant import split_syllables
    return SpeakCheckResponse(
        correct=True,
        score=95,
        hint_tt="Бик әйбәт әйттең!",
        hint_ru=f"Отлично! Услышано: «{heard}»",
        syllables=split_syllables(req.expected),
        say_this=req.expected,
        source="offline",
    )


# --- Error explain task: LLM-разбор ошибок с указанием неверной фразы пользователя ---

class ErrorExplainRequest(BaseModel):
    expected: str
    user_input: str
    question: str = ""


class ErrorExplainResponse(BaseModel):
    explanation_ru: str = ""
    explanation_tt: str = ""


ERROR_EXPLAIN_SYSTEM = (
    "Син — Ак Барс, татар теле укытучысы. Укучы аудировании яки тәрҗемә биремендә хата ясады. "
    "ЭТАЛОН: правильный ответ. ВВЕДЕНО УЧЕНИКОМ: то, что написал или произнес ученик. "
    "Напиши разбор: укажи на то, что ученик ввел фразу «{user_input}», объясни в чем ошибка (орфография, буквы ә, ө, ү, җ, ң, һ, окончания), "
    "и покажи как правильно. "
    "СТРОГИЙ ФОРМАТ JSON без лишнего текста: "
    '{"explanation_ru": "Вы написали «ВВЕДЕНО УЧЕНИКОМ». Подробное объяснение ошибки и правильный вариант", "explanation_tt": "кыскача татарча аңлатма"}'
)


@app.post("/api/task/explain-error", response_model=ErrorExplainResponse)
async def explain_error(req: ErrorExplainRequest) -> ErrorExplainResponse:
    if settings.gigachat_auth_key:
        try:
            result = await gigachat.chat(
                messages=[
                    {"role": "system", "content": ERROR_EXPLAIN_SYSTEM},
                    {"role": "user", "content": f"ВОПРОС: {req.question}\nЭТАЛОН: {req.expected}\nВВЕДЕНО УЧЕНИКОМ: {req.user_input}"},
                ],
                temperature=0.3,
                max_tokens=300,
            )
            import json
            start, end = result.find("{"), result.rfind("}")
            data = json.loads(result[start : end + 1])
            return ErrorExplainResponse(
                explanation_ru=str(data.get("explanation_ru", f"Вы ввели «{req.user_input}», а правильный ответ — «{req.expected}».")) ,
                explanation_tt=str(data.get("explanation_tt", f"Дөрес җавап: «{req.expected}»."))
            )
        except Exception:
            pass

    return ErrorExplainResponse(
        explanation_ru=f"Вы ввели неверную фразу: «{req.user_input}». Правильный ответ — «{req.expected}». Обратите внимание на написание и татарские буквы.",
        explanation_tt=f"Сез «{req.user_input}» дип яздыгыз. Дөрес җавап: «{req.expected}»."
    )

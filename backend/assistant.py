"""Ярдәмче — ИИ-помощник по татарскому языку.

Если задан LLM_API_KEY — ходим в OpenAI-совместимый API.
Иначе работает офлайн-режим: мини-словарь + шаблоны объяснений,
чтобы WebApp был живым без ключей и интернета к LLM.
"""

from __future__ import annotations

import httpx

from config import settings

SYSTEM_PROMPT = (
    "Син — Ярдәмче, татар телен өйрәнүдә ярдәмче. "
    "Отвечай кратко и дружелюбно, на русском с татарскими примерами. "
    "Каждое татарское слово давай с переводом и простой транскрипцией. "
    "Ты — помощник приложения «Татар.Уку», где язык учат островами тем: "
    "Сәлам (приветствия), Саннар (числа), Гаилә (семья), "
    "Ашамлыклар (еда), Табигать (природа), Сәяхәт (путешествие)."
)

# Офлайн мини-словарь: ключ — подстрока вопроса.
OFFLINE_PHRASES: tuple[tuple[str, str], ...] = (
    ("спасибо", "«Спасибо» — рәхмәт (рәх-мәт). Вежливо: зур рәхмәт — большое спасибо."),
    ("рәхмәт", "Әйе! Рәхмәт — «спасибо». Ответ: рәхим ит — «пожалуйста» в ответ на благодарность."),
    ("привет", "«Привет» — сәлам! Другу: исәнме! Вежливо/старшим: исәнмесез!"),
    ("здравствуй", "Исәнмесез! (и-сән-ме-сез) — здравствуйте. Другу короче: исәнме!"),
    ("как дела", "«Как дела?» — хәлләр ничек? (хәл-ләр ни-чек). Ответить: әйбәт, рәхмәт! — хорошо, спасибо!"),
    ("меня зовут", "«Меня зовут …» — минем исемем … А спросить: синең исемең ничек?"),
    ("до свидания", "Сау булыгыз! (сау бу-лы-гыз) — до свидания. Другу: сау бул!"),
    ("да", "«Да» — әйе (әй-е). «Нет» — юк (юк)."),
    ("мама", "Әни (ә-ни) — мама. Әти — папа, апа — сестра, абый — брат."),
    ("один", "Бер, ике, өч, дүрт, биш — 1, 2, 3, 4, 5. Продолжи на острове Саннар!"),
    ("чай", "Чәй (чәй) — чай. К чаю: чәкчәк, өчпочмак и бал — мёд."),
)

OFFLINE_FALLBACK = (
    "Офлайн-режим: я знаю базовые фразы — спроси про приветствия, "
    "числа, семью или еду. А с ключом LLM_API_KEY я стану полноценным "
    "собеседником: см. backend/.env.example."
)


async def ask_assistant(message: str) -> str:
    message = message.strip()
    if not message:
        return "Спроси что-нибудь про татарский — слово, фразу или правило."
    if LLM_AVAILABLE:
        return await _ask_llm(message)
    return _ask_offline(message)


def _ask_offline(message: str) -> str:
    low = message.lower()
    for key, answer in OFFLINE_PHRASES:
        if key in low:
            return answer
    return OFFLINE_FALLBACK


async def _ask_llm(message: str) -> str:
    url = settings.llm_base_url.rstrip("/") + "/chat/completions"
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                url,
                headers={"Authorization": f"Bearer {settings.llm_api_key}"},
                json={
                    "model": settings.llm_model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": message},
                    ],
                    "temperature": 0.7,
                    "max_tokens": 500,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception:
        # LLM упал посреди диалога — деградируем в офлайн-режим.
        return _ask_offline(message)


# --- Строгий судья произношения (Ollama / любой OpenAI-совместимый LLM) ---

LLM_AVAILABLE = False

GRADE_SYSTEM = (
    "Син — татар теле укытучысы. Укучы фразу әйтергә тиеш. "
    "Отвечай СТРОГО JSON без пояснений: "
    '{"correct": bool, "hint_ru": "короткая подсказка по-русски (до 15 слов), что исправить", '
    '"syllables": ["слоги эталона через дефис-логику"], "say_this": "эталон целиком"}. '
    "Прощай мелкие огрехи распознавания (регистр, пунктуация). "
    "Если услышанное явно не совпадает с эталоном — correct=false и конкретная подсказка."
)

VOWELS = set("аәеёиоуөүыяюэАӘЕЁИОУӨҮЫЯЮЭ")


def split_syllables(word: str) -> list[str]:
    """Наивная разбивка: режем перед согласным, за которым идёт гласная."""
    clean = "".join(ch for ch in word if ch.isalpha())
    chunks, cur = [], ""
    chars = list(clean)
    for i, ch in enumerate(chars):
        nxt = chars[i + 1] if i + 1 < len(chars) else ""
        if (
            cur
            and ch not in VOWELS
            and nxt in VOWELS
            and any(c in VOWELS for c in cur)
        ):
            chunks.append(cur)
            cur = ""
        cur += ch
    if cur:
        chunks.append(cur)
    return [c for c in chunks if c] or [word]


async def probe_llm() -> bool:
    """Проверка доступности LLM при старте (Ollama: GET /models)."""
    global LLM_AVAILABLE
    try:
        base = settings.llm_base_url.rstrip("/")
        if base.endswith("/v1"):
            base = base[: -len("/v1")]
        async with httpx.AsyncClient(timeout=3) as client:
            resp = await client.get(base + "/models")
            resp.raise_for_status()
        LLM_AVAILABLE = True
    except Exception:
        LLM_AVAILABLE = False
    return LLM_AVAILABLE


async def _grade_llm(expected: str, heard: str) -> dict | None:
    url = settings.llm_base_url.rstrip("/") + "/chat/completions"
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                url,
                headers={"Authorization": f"Bearer {settings.llm_api_key}"},
                json={
                    "model": settings.llm_model,
                    "messages": [
                        {"role": "system", "content": GRADE_SYSTEM},
                        {
                            "role": "user",
                            "content": f"ЭТАЛОН: {expected}\nУСЛЫШАНО: {heard}",
                        },
                    ],
                    "temperature": 0.2,
                    "max_tokens": 300,
                },
            )
            resp.raise_for_status()
            text = resp.json()["choices"][0]["message"]["content"]
        start, end = text.find("{"), text.rfind("}")
        data = __import__("json").loads(text[start : end + 1])
        return {
            "correct": bool(data.get("correct")),
            "hint_ru": str(data.get("hint_ru") or "Попробуй ещё раз, медленно."),
            "syllables": list(data.get("syllables") or split_syllables(expected)),
            "say_this": str(data.get("say_this") or expected),
            "source": "llm",
        }
    except Exception:
        return None


async def grade_pronunciation(expected: str, heard: str) -> dict:
    """Строгая проверка: LLM-судья, иначе Левенштейн + шаблоны."""
    if LLM_AVAILABLE:
        judged = await _grade_llm(expected, heard)
        if judged:
            return judged
    from island_logic import check_answer

    base = check_answer(expected, heard)
    syl = split_syllables(expected)
    hint = (
        "Дөрес! Молодец!"
        if base["correct"]
        else f"Скажи по слогам: {' – '.join(syl)}. Потом целиком: «{expected}»."
    )
    return {
        "correct": base["correct"],
        "hint_ru": hint,
        "syllables": syl,
        "say_this": expected,
        "source": "offline",
    }

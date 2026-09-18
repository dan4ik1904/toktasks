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
    "КАГЫДА: җавапны ҺӘРВАКЫТ башта татарча бир (1-3 җөмлә, тере сөйләм), "
    "аннары русча тәрҗемә һәм кыска аңлатма. "
    "Ты — помощник приложения «Татар.Уку», где язык учат островами тем: "
    "Сәлам (приветствия), Саннар (числа), Гаилә (семья), "
    "Ашамлыклар (еда), Табигать (природа), Сәяхәт (путешествие)."
)

# Офлайн мини-словарь: сначала татарский ответ, потом русский перевод.
OFFLINE_PHRASES: tuple[tuple[str, str], ...] = (
    ("спасибо", "«Рәхмәт!» — менә шулай рәхмәт әйтәләр. (Вот так говорят «спасибо». Вежливо: «Зур рәхмәт!».)"),
    ("рәхмәт", "«Рәхим ит!» — шулай җавап бирәләр. (Так отвечают на благодарность.)"),
    ("привет", "«Сәлам!» — дустыңа. «Исәнмесез!» — өлкәннәргә. (Другу — сәлам, старшим — исәнмесез.)"),
    ("здравствуй", "«Исәнмесез!» — хәерле көн! (Здравствуйте! Буквально: «здоровы ли вы?».)"),
    ("как дела", "«Хәлләр ничек?» — «Әйбәт, рәхмәт!» (Как дела? — Хорошо, спасибо!)"),
    ("меня зовут", "«Минем исемем …» — «Синең исемең ничек?» (Меня зовут … — А тебя как?)"),
    ("до свидания", "«Сау булыгыз!» — саулык белән! (До свидания!)"),
    ("да", "«Әйе!» — әйе. «Юк!» — юк. (Да — әйе. Нет — юк.)"),
    ("мама", "«Әни, әти, апа, абый!» — гаилә. (Мама, папа, сестра, брат — семья.)"),
    ("один", "«Бер, ике, өч, дүрт, биш!» — сана! (Раз…пять — считай! Продолжи на острове Саннар.)"),
    ("чай", "«Чәй эчәбез!» — чәкчәк белән. (Пьём чай! С чак-чаком.)"),
)

OFFLINE_FALLBACK = (
    "«Әйт әле тагын!» — аңламадым. "
    "(Скажи ещё раз — не понял. Спроси про приветствия, числа, семью или еду.)"
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
    '{"correct": bool, "hint_tt": "подсказка ПО-ТАТАРСКИ (до 15 слов)", '
    '"hint_ru": "перевод подсказки по-русски", '
    '"syllables": ["слоги эталона"], "say_this": "эталон целиком"}. '
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
            "hint_tt": str(data.get("hint_tt") or "Тыңла һәм кабатла."),
            "hint_ru": str(data.get("hint_ru") or "Послушай и повтори."),
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
    if base["correct"]:
        hint_tt, hint_ru = "Дөрес! Бик шәп!", "Правильно! Очень круто!"
    else:
        hint_tt = f"Тыңла һәм кабатла: {' – '.join(syl)}"
        hint_ru = f"Послушай и повтори по слогам, потом целиком: «{expected}»."
    return {
        "correct": base["correct"],
        "hint_tt": hint_tt,
        "hint_ru": hint_ru,
        "syllables": syl,
        "say_this": expected,
        "source": "offline",
    }

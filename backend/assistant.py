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
    if settings.llm_api_key:
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
        # LLM недоступен — деградируем в офлайн-режим, а не падаем.
        return _ask_offline(message) + "\n(LLM временно недоступен.)"

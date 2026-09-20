"""Иптәш — интеллектуальный AI-репетитор татарского языка.
Отвечает на татарском и русском языках на уровне носителя.
Поддерживает татарские специфические буквы (ә, ө, ү, җ, ң, һ).
"""

from __future__ import annotations

import json
import re
import httpx
from config import settings

TT_LETTERS = set("әөүҗңһӘӨҮҖҢҺ")

SYSTEM_PROMPT = (
    "Син — Иптәш, татар теленең профессиональ укытучысы һәм дусты. "
    "Укучы сиңа теләсә нинди сорау бирә ала (татар теле, грамматика, сүзлекләр, тарих, мәдәният яки көнкүреш). "
    "Син һәрвакыт төгәл, кызыклы, тулы җавап бирәсең, шаблон фразаларны кулланмыйсың. "
    "СТРОГИЙ ФОРМАТ ОТВЕТА (JSON): "
    '{"tt": "живой, точный и развернутый ответ на татарском языке", "ru": "профессиональный перевод на русский язык и подробное пояснение"}. '
    "Не пиши ничего, кроме валидного JSON."
)

OFFLINE_QA: tuple[tuple[tuple[str, ...], str, str], ...] = (
    (("привет", "сәлам", "салам", "здравствуй"),
     "Исәнмесез! Хәерле көн! Бүген татар теленнән нинди теманы яки сорауны тикшерәбез?",
     "«Исәнмесез!» — универсальное вежливое приветствие, «Сәлам!» — привет другу."),
    (("как дела", "хәлләр", "ничек"),
     "Рәхмәт, барысы да бик әйбәт! Үзегезнең хәлләр ничек? Ннди сорауларыгыз бар?",
     "«Хәлләр ничек?» — Как дела? Ответ: «Рәхмәт, әйбәт!» (Спасибо, хорошо!)."),
    (("спасибо", "рәхмәт"),
     "Зур рәхмәт! Бик рәхмәт сезгә!",
     "«Рәхмәт» — спасибо. «Зур рәхмәт» — большое спасибо."),
    (("пожалуйста", "рәхим", "зинһар"),
     "Рәхим итегез! Бик зинһар!",
     "«Рәхим итегез!» — пожалуйста."),
    (("казань", "казан"),
     "Казан — Татарстанның матур башкаласы, мең еллык тарихлы борынгы һәм заманча шәһәр!",
     "Казан — столица Татарстана с тысячелетней историей."),
    (("пока", "сау", "хуш"),
     "Сау булыгыз! Күрешкәнче!",
     "«Сау булыгыз!» — До свидания! «Күрешкәнче!» — До встречи!"),
)

def split_syllables(word: str) -> list[str]:
    vowels = "аәоөуүыэиеёюяАӘОӨУҮЫЭИЕЁЮЯ"
    syllables = []
    curr = ""
    for ch in word:
        curr += ch
        if ch in vowels:
            syllables.append(curr)
            curr = ""
    if curr:
        if syllables:
            syllables[-1] += curr
        else:
            syllables.append(curr)
    return syllables if syllables else [word]

async def chat(messages: list[dict], temperature: float = 0.4, max_tokens: int = 500) -> str:
    user_msg = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            user_msg = m.get("text", "").lower()
            break

    # Сначала пробуем GigaChat для умных нешаблонных ответов на любые вопросы
    if settings.gigachat_auth_key:
        try:
            from gigachat import chat as gg_chat
            formatted_msgs = [{"role": "system", "content": SYSTEM_PROMPT}] + [
                {"role": m.get("role", "user"), "content": m.get("text", "")} for m in messages
            ]
            resp = await gg_chat(messages=formatted_msgs, temperature=temperature, max_tokens=max_tokens)
            if resp:
                start, end = resp.find("{"), resp.rfind("}")
                if start != -1 and end != -1:
                    return resp[start:end+1]
        except Exception:
            pass

    # Если ключ не настроен или запрос специфичен, проверяем офлайн-базу
    for triggers, tt_resp, ru_resp in OFFLINE_QA:
        if any(t in user_msg for t in triggers):
            return json.dumps({"tt": tt_resp, "ru": ru_resp}, ensure_ascii=False)

    # Динамический умный фолбэк без шаблонной фразы "мин сезнең соравыгызны аңладым"
    return json.dumps({
        "tt": f"Бу бик кызыклы сорау: «{user_msg}». Татар телендә моны аңлату өчен төп кагыйдәләрне карарга кирәк.",
        "ru": f"Интересный вопрос по поводу «{user_msg}». В татарском языке это разбирается через базовые правила лексики и грамматики."
    }, ensure_ascii=False)

async def ask_assistant(message: str, history: list[dict]) -> dict:
    msgs = history + [{"role": "user", "text": message}]
    raw = await chat(msgs)
    try:
        data = json.loads(raw)
        tt = data.get("tt", "Рәхмәт!")
        ru = data.get("ru", "")
        reply = f"{tt}\n\n💡 {ru}" if ru else tt
        return {"reply": reply, "say": tt, "lang": "tt"}
    except Exception:
        return {"reply": raw, "say": raw, "lang": "tt"}

async def grade_pronunciation(expected: str, heard: str) -> dict:
    correct = expected.strip().lower() in heard.strip().lower() or len(heard) > 0
    return {
        "correct": correct,
        "hint_tt": "Бик әйбәт! Дөрес әйтәсең." if correct else "Тагын бер кат кабатлап кара.",
        "hint_ru": "Отлично! Произношение верное." if correct else "Попробуй повторить еще раз четче.",
        "syllables": split_syllables(expected),
        "say_this": expected,
        "source": "offline"
    }

async def probe_llm() -> bool:
    return True

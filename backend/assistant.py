"""Иптәш — интеллектуальный AI-репетитор татарского языка.
Отвечает на татарском и русском языках на уровне носителя.
Поддерживает татарские специфические буквы (ә, ө, ү, җ, ң, һ).
"""

from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET

import httpx
from config import settings

TT_LETTERS = set("әөүҗңһӘӨҮҖҢҺ")

# --- Детерминированные переводы: точный ответ из словаря, а не выдумка модели ---

_RU_TT_PATTERNS = (
    r"как\s+(будет|сказать|переводится)\s+[«\"'‘’]?\s*(.+?)\s*[»\"'‘’]?\s+по-татарски",
    r"(?:а|и)\s+как\s+(будет|сказать)\s+[«\"'‘’]?\s*(.+?)\s*[»\"'‘’]?\s*\??$",
    r"(.+?)\s+по-татарски\s+как(?:\s+будет)?",
    r"переведи(?:те)?\s+(?:пожалуйста,?\s+)?[«\"']?\s*(.+?)\s*[»\"']?\s*(?:на\s+татарский(?:\s+язык)?)?$",
)
_TT_RU_PATTERNS = (
    r"(?:что\s+)?(?:значит|означает|такое)\s+[«\"'‘’]?\s*(.+?)\s*[»\"'‘’]?\s*\??$",
)

_PUNCT = re.compile(r"[^\w\s]", re.UNICODE)


def _norm_word(s: str) -> str:
    return _PUNCT.sub("", s.lower()).strip()


def _clean_phrase(s: str) -> str:
    s = s.strip().strip("«»\"'‘’?!.,").strip()
    s = re.sub(r"\s+", " ", s)
    return s


def _detect_translation_query(text: str) -> tuple[str, str] | None:
    """Возвращает (src, dst, фраза) для переводческих вопросов либо None."""
    t = _clean_phrase(text)
    if not t or len(t) > 100:
        return None
    low = t.lower()
    for pat in _RU_TT_PATTERNS:
        m = re.search(pat, low)
        if m:
            phrase = _clean_phrase(m.group(m.lastindex or 2))
            if 0 < len(phrase.split()) <= 6:
                return ("ru", "tt", phrase)
    for pat in _TT_RU_PATTERNS:
        m = re.search(pat, low)
        if m:
            phrase = _clean_phrase(m.group(1))
            words = phrase.split()
            # tt->ru только для коротких фраз с татарскими буквами — иначе это общий вопрос модели
            if 0 < len(words) <= 4 and any(ch in TT_LETTERS for ch in phrase):
                return ("tt", "ru", phrase)
    # «переведи X» без явного направления — по алфавиту фразы
    return None


def _offline_vocab_lookup(text: str, src: str, dst: str) -> str | None:
    """Поиск по словам островов с сохранением исходного регистра."""
    try:
        from island_logic import ISLANDS, _norm
        key = _norm(text)
        for island in ISLANDS:
            for lesson in island.get("lessons", []):
                for w in lesson.get("words", []):
                    tt, ru = str(w.get("tt", "")), str(w.get("ru", ""))
                    if src == "tt" and dst == "ru" and _norm(tt) == key:
                        return ru
                    if src == "ru" and dst == "tt" and _norm(ru) == key:
                        return tt
    except Exception:
        return None
    return None


async def _tatsoft_translate(text: str, src: str, dst: str) -> str | None:
    lang = "0" if (src == "ru" and dst == "tt") else "1"
    try:
        async with httpx.AsyncClient(
            base_url=settings.tatsoft_translate_base.rstrip("/"), timeout=8
        ) as client:
            resp = await client.get("/translate", params={"lang": lang, "text": text})
            resp.raise_for_status()
            body = resp.text.strip()
            if not body:
                return None
            if body.startswith("<"):
                root = ET.fromstring(body)
                mt = root.findtext("mt")
                return mt.strip() if mt and mt.strip() else None
            return body
    except Exception:
        return None


async def translate_direct(text: str, src: str, dst: str) -> str | None:
    """Точный перевод: сначала Tatsoft, затем офлайн-словарь островов."""
    hit = await _tatsoft_translate(text, src, dst)
    if hit:
        return hit
    return _offline_vocab_lookup(text, src, dst)

SYSTEM_PROMPT = (
    "Син — Иптәш, татар теленең профессиональ укытучысы һәм дусты. "
    "Укучы сиңа теләсә нинди сорау бирә ала (татар теле, грамматика, сүзлекләр, тарих, мәдәният яки көнкүреш). "
    "Диалогның тарихын исәпкә ал: алдагы репликаларга таян, контекстны тот, үзеңне кабатлама, кирәк чакта кыска ачыклау соравы бир. "
    "Тел кагыйдәсе: соңгы хәбәр русча икән — төп җавап русча, татарча мисаллар белән; татарча икән — төп җавап татарча, русча аңлатма белән. "
    "Җавап кыска булсын: һәр телгә 2-4 җөмлә. "
    "КАТЕТ: татар сүзләрен беркайчан уйлап чыгарма! Төгәл формага ышанмасаң — русча аңлат һәм моны әйт. Дөрес кыска җавап ялган озыннан яхшырак. "
    "Проверенные слова (используй их точь-в-точь): әни — мама; әти — папа; сәлам/исәнме — привет; рәхмәт — спасибо; сау бул — до свидания; Казан — Казань; китап — книга; су — вода; ипи — хлеб; чәй — чай; сөт — молоко; эт — собака; мәче — кошка; укырга — читать; яратырга — любить; барырга — идти. "
    "Пример правильного ответа на «Как будет спасибо?»: "
    '{"tt": "Рәхмәт", "ru": "«Спасибо» по-татарски — «Рәхмәт». Вежливо: «Зур рәхмәт» — большое спасибо."}. '
    "СТРОГИЙ ФОРМАТ ОТВЕТА (только валидный JSON, без markdown): "
    '{"tt": "ответ на татарском", "ru": "ответ на русском"}.'
)

# Короткие реплики-приветствия: срабатывают только на короткие сообщения,
# чтобы «Сәлам! Падежлар турында...» уходило в тематический ответ
GREET_QA: tuple[tuple[tuple[str, ...], str, str], ...] = (
    (("привет", "сәлам", "салам", "здравствуй"),
     "Исәнмесез! Хәерле көн! Бүген татар теленнән нинди теманы яки сорауны тикшерәбез?",
     "«Исәнмесез!» — универсальное вежливое приветствие, «Сәлам!» — привет другу."),
    (("как дела", "хәлләр", "ничек"),
     "Рәхмәт, барысы да бик әйбәт! Үзегезнең хәлләр ничек? Нинди сорауларыгыз бар?",
     "«Хәлләр ничек?» — Как дела? Ответ: «Рәхмәт, әйбәт!» (Спасибо, хорошо!)."),
    (("спасибо", "рәхмәт"),
     "Зур рәхмәт! Бик рәхмәт сезгә!",
     "«Рәхмәт» — спасибо. «Зур рәхмәт» — большое спасибо."),
    (("пожалуйста", "рәхим", "зинһар"),
     "Рәхим итегез! Бик зинһар!",
     "«Рәхим итегез!» — пожалуйста."),
    (("пока", "сау", "хуш"),
     "Сау булыгыз! Күрешкәнче!",
     "«Сау булыгыз!» — До свидания! «Күрешкәнче!» — До встречи!"),
)

OFFLINE_QA: tuple[tuple[tuple[str, ...], str, str], ...] = (
    (("казань", "казан"),
     "Казан — Татарстанның матур башкаласы, мең еллык тарихлы борынгы һәм заманча шәһәр!",
     "Казан — столица Татарстана с тысячелетней историей."),
    (("алфавит", "букв", "әлифба", "хәреф"),
     "Татар әлифбасында 39 хәреф: русныкына өстәп Ә, Ө, Ү, Җ, Ң, Һ. Ә — ачык «а», Ө — «ө», Ү — «ү», Җ — йомшак «жь», Ң — борын авазы (таң), Һ — сулышлы «h».",
     "В татарском алфавите 39 букв: к русским добавляются Ә, Ө, Ү, Җ, Ң, Һ. Ә — открытое «а», Җ — мягкое «жь», Ң — носовой звук (как в «таң» — заря), Һ — придыхательное «h»."),
    (("падеж", "килеш", "окончани"),
     "Татар телендә 6 килеш: Баш (кем? нәрсә? — китап), Иялек (кемнең? — китапның), Юнәлеш (кемгә? кая? — китапка), Төшем (кемне? — китапны), Урын (кайда? — китапта), Чыгыш (кайдан? — китаптан).",
     "В татарском 6 падежей: именительный (китап — книга), притяжательный (китапның), направительный (китапка — в книгу), винительный (китапны), местный (китапта — в книге), исходный (китаптан — из книги)."),
    (("глагол", "фигыль", "время", "заман", "барам", "барырга", "инфинитив", "спряж"),
     "Фигыль заманнары: хәзерге (мин барам — я иду), үткән (мин бардым — я ходил), киләчәк (мин барачакмын / барырмын — я пойду). Инфинитив: -ырга/-ергә (барырга, укырга, яратырга).",
     "Времена глагола: настоящее (мин барам — я иду), прошедшее (мин бардым), будущее (мин барачакмын). Инфинитив оканчивается на -ырга/-ергә: барырга (идти), яратырга (любить)."),
    (("числ", "саннар", "цифр", "сколько"),
     "Саннар: бер (1), ике (2), өч (3), дүрт (4), биш (5), алты (6), җиде (7), сигез (8), тугыз (9), ун (10), егерме (20), йөз (100), мең (1000). «Миңа егерме яшь» — мне двадцать лет.",
     "Числительные: бер (1), ике (2), өч (3), дүрт (4), биш (5), алты (6), җиде (7), сигез (8), тугыз (9), ун (10), егерме (20), йөз (100), мең (1000)."),
    (("семья", "гаилә", "мама", "папа", "әни", "әти"),
     "Гаилә: әни (мама), әти (папа), бабай (дедушка), әби (бабушка), абый (старший брат), апа (старшая сестра), эне (младший). «Минем гаиләм бик тату» — моя семья очень дружная.",
     "Семья: әни (мама), әти (папа), бабай (дедушка), әби (бабушка), абый (старший брат), апа (старшая сестра). Притяжательность: минем абыйым — мой брат."),
    (("еда", "ашамлык", "хлеб", "чай", "ипи", "чәй"),
     "Ашамлыклар: ипи (хлеб), чәй (чай), сөт (молоко), су (вода), алма (яблоко), өчпочмак (треугольник). «Өчпочмак бик тәмле!» — эчпочмак очень вкусный!",
     "Еда: ипи (хлеб), чәй (чай), сөт (молоко), алма (яблоко), өчпочмак. «Ашарга» — есть (инфинитив), «эчәргә» — пить."),
    (("кто ты", "кто вы", "син кем", "иптәш"),
     "Мин — Иптәш, синең татар теле укытучың һәм дустың! Миннән грамматика, сүзләр, тәрҗемә сора — яки жә татарча сөйләшик!",
     "Я — Иптәш, твой учитель татарского и друг! Спрашивай про грамматику, слова, переводы — или просто поболтаем по-татарски!"),
    (("похож на турецкий", "турецкий", "төрек", "тюркск"),
     "Татар теле һәм төрек теле — тугандаш төрки телләр: татарча кыпчак төркеменә, төрекчә уғыз төркеменә керә. Икесендә дә ялгаулар (агглютинация) һәм сузыклар гармониясе бар, күп уртак сүзләр очрый: су — su, ай — ay, кул — kol (рука).",
     "Татарский и турецкий — родственные тюркские языки: татарский из кыпчакской группы, турецкий — из огузской. Общая грамматика (агглютинация, сингармонизм) и общие корни: су — su (вода), ай — ay (луна). Понимать друг друга без учёбы сложно, но учить легче."),
    (("тукай", "тукая", "шагыйрь", "поэт"),
     "Габдулла Тукай (1886–1913) — бөек татар шагыйре, хәзерге татар әдәби теленә нигез салучы. Аның «Шүрәле» һәм «Су анасы» әкиятләрен һәр татар баласы белә.",
     "Габдулла Тукай (1886–1913) — великий татарский поэт, основоположник современного литературного языка. Его сказки «Шүрәле» и «Су анасы» знает каждый."),
    (("сабантуй", "праздник плуга", "бәйрәм"),
     "Сабантуй — чәчү эшләре беткәч үткәрелә торган татар халык бәйрәме. Төп ярышлар: көрәш (билбау көрәше), ат чабышы, капчык киеп йөгерү. Хәзер Сабантуй дөнья буйлап үткәрелә.",
     "Сабантуй — народный праздник плуга после посевных работ. Главные состязания: көрәш (борьба на поясах), скачки, бег в мешках. Сегодня Сабантуй отмечают по всему миру."),
    (("сколько", "миллион", "говорят", "где говорят", "кайда сөйләш"),
     "Татарча дөньяда берничә миллион кеше сөйләшә: күбесе Татарстанда, шулай ук күрше төбәкләрдә һәм чит илләрдәге диаспорада. Казан — телнең үзәге.",
     "По-татарски говорят несколько миллионов человек: в основном в Татарстане, соседних регионах и диаспорах. Центр языка — Казань."),
    (("башкирск", "башкорт"),
     "Башкорт теле — татарчага иң якын тугандаш тел (икесе дә кыпчак төркеме). Күп сүзләр охшаш, ләкин әйтелеш һәм кайбер хәрефләр аерыла.",
     "Башкирский — ближайший родственник татарского (оба кыпчакские). Много общих слов, но различаются произношение и часть букв."),
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

def _extract_json(text: str) -> dict | None:
    """Достаём {"tt": ..., "ru": ...} даже из markdown-обёртки или прозы с JSON."""
    t = (text or "").strip()
    if not t:
        return None
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", t, re.S)
    if fenced:
        t = fenced.group(1)
    else:
        start, end = t.find("{"), t.rfind("}")
        if start != -1 and end != -1 and end > start:
            t = t[start:end + 1]
    try:
        data = json.loads(t)
    except Exception:
        return None
    if isinstance(data, dict) and (data.get("tt") or data.get("ru")):
        return {"tt": str(data.get("tt") or ""), "ru": str(data.get("ru") or "")}
    return None


async def chat(messages: list[dict], temperature: float = 0.3, max_tokens: int = 600) -> str:
    # Всю историю (контекст диалога) отдаём модели как есть
    clean = [
        {"role": "assistant" if m.get("role") == "assistant" else "user",
         "content": str(m.get("text", "") or m.get("content", ""))}
        for m in messages
        if str(m.get("text", "") or m.get("content", "")).strip()
    ]
    # Последние 12 реплик — достаточно контекста и влезает в лимиты
    clean = clean[-12:]

    last_user = ""
    for m in reversed(clean):
        if m["role"] == "user":
            last_user = m["content"]
            break
    user_low = last_user.lower()

    # Переводческие вопросы — точный ответ из словаря (модель их выдумывает)
    detected = _detect_translation_query(last_user)
    if detected:
        src, dst, phrase = detected
        # «переведи X» без направления: по алфавиту фразы
        if src == "ru" and dst == "tt" and any(ch in TT_LETTERS for ch in phrase):
            src, dst = "tt", "ru"
        hit = await translate_direct(phrase, src, dst)
        if hit:
            if dst == "tt":
                return json.dumps(
                    {"tt": hit, "ru": f"«{phrase}» по-татарски — «{hit}»."},
                    ensure_ascii=False,
                )
            return json.dumps(
                {"tt": phrase, "ru": f"«{phrase}» означает «{hit}»."},
                ensure_ascii=False,
            )

    # Проверенные темы — курированный ответ сразу (модель выдумывает термины)
    for triggers, tt_resp, ru_resp in OFFLINE_QA:
        if any(t in user_low for t in triggers):
            return json.dumps({"tt": tt_resp, "ru": ru_resp}, ensure_ascii=False)

    # Короткие приветствия/прощания — только на короткие реплики
    if len(user_low.split()) <= 4:
        for triggers, tt_resp, ru_resp in GREET_QA:
            if any(t in user_low for t in triggers):
                return json.dumps({"tt": tt_resp, "ru": ru_resp}, ensure_ascii=False)

    # GigaChat: умные контекстные ответы на остальные вопросы
    if settings.gigachat_auth_key:
        try:
            from gigachat import gigachat as gg
            resp = await gg.chat(
                messages=[{"role": "system", "content": SYSTEM_PROMPT}] + clean,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            data = _extract_json(resp or "")
            if data:
                return json.dumps(data, ensure_ascii=False)
        except Exception:
            pass

    # Честный фолбэк: просим уточнить вместо выдуманного "умного" ответа
    short_q = (user_low[:120] + "…") if len(user_low) > 120 else user_low
    return json.dumps({
        "tt": f"Сорауыңны ишеттем: «{short_q}». Төгәл җавап бирү өчен аны бераз ачыклап яз әле — мәсәлән, бу грамматика, тәрҗемә яки сүз мәгънәсе турындамы?",
        "ru": f"Услышал твой вопрос: «{short_q}». Чтобы ответить точно, уточни его, пожалуйста — это про грамматику, перевод или значение слова? Могу разобрать алфавит, падежи, времена глаголов и лексику."
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
    """Реальная проверка доступности LLM (вызывается на старте, не бросает)."""
    if not settings.gigachat_auth_key:
        return False
    try:
        from gigachat import gigachat as gg
        await gg.get_token()
        return True
    except Exception:
        return False

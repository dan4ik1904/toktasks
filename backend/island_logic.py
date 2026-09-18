"""Логика островов: данные, проверка ответов, хранение прогресса.

Словарь — зеркало frontend/src/data/islands.ts: слаги, названия
и слова совпадают с фронтендом.
"""

from __future__ import annotations

import json
import re
import threading
from pathlib import Path

from config import settings

XP_PER_LESSON = 20

Word = dict  # {"tt": ..., "ru": ..., "transcription": ...}

ISLANDS: list[dict] = [
    {
        "slug": "salem", "title": "Привет", "title_ru": "Сәлам",
        "description": "Первый остров: здороваемся, знакомимся, прощаемся.",
        "guide": "Ак бабай", "level": "Башлангыч",
        "lessons": [
            {"id": "salem-1", "title": "Сәламләшү", "title_ru": "Приветствие",
             "words": [
                 {"tt": "Сәлам!", "ru": "Привет!"},
                 {"tt": "Исәнмесез!", "ru": "Здравствуйте!"},
                 {"tt": "Хәерле иртә!", "ru": "Доброе утро!"},
                 {"tt": "Хәерле көн!", "ru": "Добрый день!"},
                 {"tt": "Сау булыгыз!", "ru": "До свидания!"},
             ]},
            {"id": "salem-2", "title": "Танышу", "title_ru": "Знакомство",
             "words": [
                 {"tt": "Минем исемем …", "ru": "Меня зовут …"},
                 {"tt": "Синең исемең ничек?", "ru": "Как тебя зовут?"},
                 {"tt": "Шатмын!", "ru": "Рад знакомству!"},
                 {"tt": "Син кайдан?", "ru": "Ты откуда?"},
                 {"tt": "Мин Казаннан", "ru": "Я из Казани"},
             ]},
        ],
    },
    {
        "slug": "ashamlyk", "title": "Еда", "title_ru": "Ашамлыклар",
        "description": "Чай, өчпочмак и всё самое вкусное.",
        "guide": "Шүрәле", "level": "Башлангыч",
        "lessons": [
            {"id": "ashamlyk-1", "title": "Чәй табыны", "title_ru": "Чаепитие",
             "words": [
                 {"tt": "Исәнмесез!", "ru": "Здравствуйте!"},
                 {"tt": "чәй", "ru": "чай"},
                 {"tt": "икмәк", "ru": "хлеб"},
                 {"tt": "сөт", "ru": "молоко"},
                 {"tt": "бал", "ru": "мёд"},
                 {"tt": "чәкчәк", "ru": "чак-чак"},
                 {"tt": "өчпочмак", "ru": "треугольник (эчпочмак)"},
             ]},
        ],
    },
    {
        "slug": "sannar", "title": "Числа", "title_ru": "Саннар",
        "description": "Считаем до десяти и спрашиваем возраст.",
        "guide": "Кыш бабай", "level": "Башлангыч",
        "lessons": [
            {"id": "sannar-1", "title": "Бердән бишкә", "title_ru": "От одного до пяти",
             "words": [
                 {"tt": "бер", "ru": "один"}, {"tt": "ике", "ru": "два"},
                 {"tt": "өч", "ru": "три"}, {"tt": "дүрт", "ru": "четыре"},
                 {"tt": "биш", "ru": "пять"},
             ]},
            {"id": "sannar-2", "title": "Алтыдан унға", "title_ru": "От шести до десяти",
             "words": [
                 {"tt": "алты", "ru": "шесть"}, {"tt": "җиде", "ru": "семь"},
                 {"tt": "сигез", "ru": "восемь"}, {"tt": "тугыз", "ru": "девять"},
                 {"tt": "ун", "ru": "десять"},
             ]},
        ],
    },
    {
        "slug": "gaila", "title": "Семья", "title_ru": "Гаилә",
        "description": "Рассказываем о близких и родных.",
        "guide": "Әби", "level": "Башлангыч",
        "lessons": [
            {"id": "gaila-1", "title": "Якыннар", "title_ru": "Близкие",
             "words": [
                 {"tt": "әни", "ru": "мама"}, {"tt": "әти", "ru": "папа"},
                 {"tt": "апа", "ru": "сестра"}, {"tt": "абый", "ru": "брат"},
                 {"tt": "бабай", "ru": "дедушка"}, {"tt": "әби", "ru": "бабушка"},
             ]},
        ],
    },
    {
        "slug": "hayvannar", "title": "Животные", "title_ru": "Хайваннар",
        "description": "Бүре, аю һәм урман дуслары.",
        "guide": "Бүре", "level": "Башлангыч",
        "lessons": [
            {"id": "hayvannar-1", "title": "Урман дуслары", "title_ru": "Лесные друзья",
             "words": [
                 {"tt": "бүре", "ru": "волк"}, {"tt": "аю", "ru": "медведь"},
                 {"tt": "төлке", "ru": "лиса"}, {"tt": "куян", "ru": "заяц"},
                 {"tt": "ат", "ru": "лошадь"}, {"tt": "песи", "ru": "кошка"},
             ]},
        ],
    },
    {
        "slug": "shahar", "title": "Город", "title_ru": "Шәһәр",
        "description": "Казан урамнары буйлап сәяхәт.",
        "guide": "Салих абый", "level": "Башлангыч",
        "lessons": [
            {"id": "shahar-1", "title": "Шәһәрдә", "title_ru": "В городе",
             "words": [
                 {"tt": "урам", "ru": "улица"}, {"tt": "мәйдан", "ru": "площадь"},
                 {"tt": "күпер", "ru": "мост"}, {"tt": "вокзал", "ru": "вокзал"},
                 {"tt": "музей", "ru": "музей"}, {"tt": "Казан кремле", "ru": "Казанский кремль"},
             ]},
        ],
    },
    {
        "slug": "tabigat", "title": "Природа", "title_ru": "Табигать",
        "description": "Идел, урман һәм болытлар турында.",
        "guide": "Су анасы", "level": "Дәвам",
        "lessons": [
            {"id": "tabigat-1", "title": "Әйләнә-тирә", "title_ru": "Вокруг нас",
             "words": [
                 {"tt": "кояш", "ru": "солнце"}, {"tt": "ай", "ru": "луна"},
                 {"tt": "су", "ru": "вода"}, {"tt": "урман", "ru": "лес"},
                 {"tt": "чәчәк", "ru": "цветок"}, {"tt": "кош", "ru": "птица"},
             ]},
        ],
    },
    {
        "slug": "sayahet", "title": "Путешествие", "title_ru": "Сәяхәт",
        "description": "Юлга җыенабыз: юнәлешләр һәм транспорт.",
        "guide": "Юлчы бабай", "level": "Дәвам",
        "lessons": [
            {"id": "sayahet-1", "title": "Юлда", "title_ru": "В пути",
             "words": [
                 {"tt": "юл", "ru": "дорога"}, {"tt": "поезд", "ru": "поезд"},
                 {"tt": "очкыч", "ru": "самолёт"}, {"tt": "уңга", "ru": "направо"},
                 {"tt": "сулга", "ru": "налево"}, {"tt": "туры", "ru": "прямо"},
             ]},
        ],
    },
    {
        "slug": "tosler", "title": "Цвета", "title_ru": "Төсләр",
        "description": "Яшел урман, зәңгәр күк, алтын көн.",
        "guide": "Алтын кош", "level": "Дәвам",
        "lessons": [
            {"id": "tosler-1", "title": "Төсләр", "title_ru": "Цвета",
             "words": [
                 {"tt": "кызыл", "ru": "красный"}, {"tt": "яшел", "ru": "зелёный"},
                 {"tt": "зәңгәр", "ru": "синий"}, {"tt": "сары", "ru": "жёлтый"},
                 {"tt": "ак", "ru": "белый"}, {"tt": "кара", "ru": "чёрный"},
             ]},
        ],
    },
    {
        "slug": "vakyt", "title": "Время", "title_ru": "Вакыт",
        "description": "Көн, атна, ел — вакытны өйрәнәбез.",
        "guide": "Ай бабай", "level": "Дәвам",
        "lessons": [
            {"id": "vakyt-1", "title": "Кайчан?", "title_ru": "Когда?",
             "words": [
                 {"tt": "бүген", "ru": "сегодня"}, {"tt": "иртәгә", "ru": "завтра"},
                 {"tt": "кичә", "ru": "вчера"}, {"tt": "иртә", "ru": "утро"},
                 {"tt": "кич", "ru": "вечер"}, {"tt": "төн", "ru": "ночь"},
             ]},
        ],
    },
]


def islands_index() -> list[dict]:
    return [
        {"slug": i["slug"], "title": i["title"], "title_ru": i["title_ru"],
         "guide": i["guide"], "level": i["level"],
         "lessons": len(i["lessons"])}
        for i in ISLANDS
    ]


def get_island(slug: str) -> dict | None:
    return next((i for i in ISLANDS if i["slug"] == slug), None)


def lesson_ids() -> set[str]:
    return {lesson["id"] for i in ISLANDS for lesson in i["lessons"]}


def vocabulary() -> dict[str, str]:
    """Словарь tt -> ru из всех островов (для офлайн-перевода)."""
    vocab: dict[str, str] = {}
    for island in ISLANDS:
        for lesson in island["lessons"]:
            for w in lesson["words"]:
                vocab[_norm(w["tt"])] = w["ru"]
    return vocab


# --- Проверка произнесённого ---

_PUNCT = re.compile(r"[^\w\s]", re.UNICODE)


def _norm(s: str) -> str:
    return _PUNCT.sub("", s.lower()).strip()


def _lev(a: str, b: str) -> int:
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def check_answer(expected: str, heard: str) -> dict:
    """Сравнивает услышанное с эталоном. Допуск — опечатки/акцент."""
    exp, hrd = _norm(expected), _norm(heard)
    if not hrd:
        return {"correct": False, "expected": expected, "heard": heard, "distance": len(exp)}
    if exp in hrd or hrd in exp:
        return {"correct": True, "expected": expected, "heard": heard, "distance": 0}
    dist = _lev(exp, hrd)
    tolerance = max(1, len(exp) // 5)
    return {
        "correct": dist <= tolerance,
        "expected": expected,
        "heard": heard,
        "distance": dist,
    }


# --- Прогресс (JSON-файл) ---

_lock = threading.Lock()


def _progress_path() -> Path:
    p = Path(settings.progress_file)
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def _load_all() -> dict:
    try:
        return json.loads(_progress_path().read_text(encoding="utf-8"))
    except Exception:
        return {}


def get_progress(user_id: str) -> dict:
    data = _load_all().get(user_id, {"lessons": []})
    lessons: list[str] = sorted(set(data.get("lessons", [])) & lesson_ids())
    return {
        "user_id": user_id,
        "lessons": lessons,
        "xp": len(lessons) * XP_PER_LESSON,
    }


def save_progress(user_id: str, island_slug: str, lesson_id: str) -> dict:
    if get_island(island_slug) is None:
        raise ValueError(f"unknown island: {island_slug}")
    if lesson_id not in lesson_ids():
        raise ValueError(f"unknown lesson: {lesson_id}")
    with _lock:
        all_data = _load_all()
        entry = all_data.get(user_id, {"lessons": []})
        if lesson_id not in entry["lessons"]:
            entry["lessons"].append(lesson_id)
        all_data[user_id] = entry
        _progress_path().write_text(json.dumps(all_data, ensure_ascii=False), encoding="utf-8")
    return get_progress(user_id)

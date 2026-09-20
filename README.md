# TATARCHA 🏝

Telegram Web App для изучения татарского языка: **острова тем** + **ИИ-помощник Ярдәмче**.

Каждый остров — одна тема (приветствия, числа, семья, еда, природа, путешествие):
карточки слов с транскрипцией и озвучкой, короткие уроки, XP за прохождение.

## Структура

```
tatar-uku/
├── frontend/          # Next.js 16 + React 19 + TypeScript + Tailwind + shadcn/ui
│   └── src/
│       ├── app/           # App Router: / (карта), /island/[slug], /assistant
│       ├── components/    # TelegramProvider, IslandCard, TaskNumbers, AIOrb, ui/*
│       ├── data/          # острова и словарь (islands.ts)
│       └── store/         # Zustand: XP и пройденные уроки (persist)
└── backend/           # FastAPI (main.py) + aiogram 3.x (bot/)
    ├── api/           # Tatsoft: stt.py, tts.py, translate.py
    ├── island_logic.py# острова, проверка ответов, прогресс
    ├── auth.py        # валидация Telegram initData
    └── assistant.py   # Ярдәмче: LLM или офлайн-режим
```

## Быстрый старт

### Frontend

```bash
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev                  # http://localhost:3000
```

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env         # заполни BOT_TOKEN, WEBAPP_URL, Tatsoft
uvicorn main:app --reload --port 8000
```

### Telegram-бот

```bash
cd backend
source .venv/bin/activate
python -m bot.main
```

## API

- `GET /api/islands` — список островов, `GET /api/island/{slug}` — остров с уроками
- `POST /api/check` — `{expected, heard}` → `{correct, distance}`
- `POST /api/progress` — `{island_slug, lesson_id}` (+ заголовок `X-Telegram-Init-Data`)
- `POST /api/stt` (аудио → текст), `POST /api/tts` (текст → аудио), `POST /api/translate`
- Весь татарский идёт через публичный Tatsoft API хакатона
  (`tat-tts.api.translate.tatar`, `tat-asr.api.translate.tatar`, `translate.tatar`);
  без сети — фолбэки: словарь островов, Web Speech, speechSynthesis

## ИИ-помощник

Эндпоинт `POST /api/assistant/chat` → `{"message": "..."}` → `{"reply": "..."}`.

- Если доступен LLM (см. ниже) — отвечает OpenAI-совместимая модель.
- Иначе — встроенный офлайн-режим (мини-словарь), приложение работает сразу.

## Строгий судья произношения (Ollama)

`POST /api/grade` → `{expected, heard}` → `{correct, hint_ru, syllables, say_this, source}`.
Судья — локальная Ollama (офлайн, без геоблока; из РФ Gemini недоступен):

```bash
ollama pull qwen2.5 && ollama serve   # :11434
```

Настройки в `backend/.env`: `LLM_BASE_URL` (по умолчанию `http://localhost:11434/v1`),
`LLM_MODEL` (по умолчанию `qwen2.5`), `LLM_API_KEY`. Любой OpenAI-совместимый API
встаёт без кода. Без LLM — фолбэк на Левенштейна (`source: "offline"`).

## Стек

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · @telegram-apps/sdk-react 3 · Zustand · FastAPI · aiogram 3.x

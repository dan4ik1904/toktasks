# Татар.Уку 🏝

Telegram Web App для изучения татарского языка: **острова тем** + **ИИ-помощник Ярдәмче**.

Каждый остров — одна тема (приветствия, числа, семья, еда, природа, путешествие):
карточки слов с транскрипцией и озвучкой, короткие уроки, XP за прохождение.

## Структура

```
tatar-uku/
├── frontend/          # Next.js 16 + React 19 + TypeScript + Tailwind + shadcn/ui
│   └── src/
│       ├── app/           # App Router: / (карта), /island/[slug], /assistant
│       ├── components/    # TelegramProvider, ui/* (shadcn-стиль)
│       ├── data/          # острова и словарь (islands.ts)
│       └── store/         # Zustand: XP и пройденные уроки (persist)
└── backend/           # FastAPI + aiogram 3.x
    ├── app/           # API: /health, /api/islands, /api/assistant/chat
    └── bot/           # Telegram-бот: /start с кнопкой WebApp
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
cp .env.example .env         # заполни BOT_TOKEN, WEBAPP_URL
uvicorn app.main:app --reload --port 8000
```

### Telegram-бот

```bash
cd backend
source .venv/bin/activate
python -m bot.main
```

## ИИ-помощник

Эндпоинт `POST /api/assistant/chat` → `{"message": "..."}` → `{"reply": "..."}`.

- Если задан `LLM_API_KEY` — отвечает OpenAI-совместимая модель (см. `LLM_BASE_URL`, `LLM_MODEL`).
- Без ключа — встроенный офлайн-режим (мини-словарь), приложение работает сразу.

## Стек

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · @telegram-apps/sdk-react 3 · Zustand · FastAPI · aiogram 3.x

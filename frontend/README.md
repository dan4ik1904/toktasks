# TATARCHA — frontend

Telegram Web App: острова тем татарского языка + ИИ-помощник Ярдәмче.
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · shadcn/ui · @telegram-apps/sdk-react 3 · Zustand.

## Старт

```bash
cp .env.example .env.local
npm install
npm run dev      # http://localhost:3000
```

## Страницы

- `/` — карта островов, прогресс, XP
- `/island/[slug]` — уроки острова, карточки слов, озвучка, кнопка «Завершить урок»
- `/assistant` — чат с Ярдәмче (`NEXT_PUBLIC_API_URL`)

## Замечания

- `TelegramProvider` безопасно работает и вне Telegram (обычный браузер).
- Прогресс хранится локально (Zustand persist).

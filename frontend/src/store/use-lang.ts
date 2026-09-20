"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Интерфейс — только на русском. Татарский живёт точечно:
// названия, подзаголовки, имя Иптәша, игровые термины.
export type Lang = "ru";

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const DICT: Record<string, string> = {
  home: "Главная",
  learning: "Обучение",
  assistant: "Иптәш",
  games: "Игры",
  profile: "Профиль",
  streak: "Серия дней",
  xp: "Очки XP",
  tasks: "Уроков",
  lives: "Жизни",
  achievements: "Достижения",
  partner: "Ресторан «Тюбетей» • Скидки за XP",
  partnerSub: "Обменивай баллы на скидки и эчпочмаки",
  askAkBars: "Спросить репетитора",
  level: "Уровень",
  reset: "Сбросить прогресс",
  mutedMode: "Беззвучный режим (озвучка ИИ)",
  on: "Вкл",
  off: "Выкл",
  lessonTreeTitle: "Древо уроков",
  lessonTreeDesc: "Выполнено сегодня",
  miniGamesTitle: "Мини-игры",
  miniGamesDesc: "Слова и квизы",
  lessonsTitle: "Уроки татарского",
  lessonsSubtitle: "Проходите уровни последовательно для лучших результатов",
  gamesMainTitle: "Мини-игры",
  gamesMainSubtitle: "Практика слов и грамматики в игровом формате",
};

export const useLang = create<LangState>()(
  persist(
    (set, _get) => ({
      lang: "ru",
      setLang: (lang) => set({ lang }),
      t: (key: string) => DICT[key] || key,
    }),
    { name: "tatarcha-lang" },
  ),
);

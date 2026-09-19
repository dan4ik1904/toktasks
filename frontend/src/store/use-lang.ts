"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Lang = "ru" | "en" | "tt";

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const DICT: Record<Lang, Record<string, string>> = {
  ru: {
    home: "Главная",
    learning: "Обучение",
    assistant: "Ак Барс",
    games: "Игры",
    profile: "Профиль",
    streak: "Серия дней",
    xp: "Очки XP",
    tasks: "Уроков",
    lives: "Жизни",
    achievements: "Достижения",
    partner: "Ресторан «Тюбетей» • Скидки",
    askAkBars: "Спросить Ак Барса",
    level: "Уровень",
    reset: "Сбросить прогресс",
  },
  en: {
    home: "Home",
    learning: "Learning",
    assistant: "Ak Bars",
    games: "Games",
    profile: "Profile",
    streak: "Day Streak",
    xp: "XP Points",
    tasks: "Lessons",
    lives: "Hearts",
    achievements: "Achievements",
    partner: "Tyubetey Restaurant • Discounts",
    askAkBars: "Ask Ak Bars",
    level: "Level",
    reset: "Reset progress",
  },
  tt: {
    home: "Баш бит",
    learning: "Үзү",
    assistant: "Ак Барс",
    games: "Уеннар",
    profile: "Профиль",
    streak: "Көннәр сериясе",
    xp: "Баллар XP",
    tasks: "Дәресләр",
    lives: "Гомерләр",
    achievements: "Казаннар",
    partner: "«Тюбетей» рестораны • Ташламалар",
    askAkBars: "Ак Барстан сора",
    level: "Дәрәҗә",
    reset: "Прогрессны чистарту",
  },
};

export const useLang = create<LangState>()(
  persist(
    (set, get) => ({
      lang: "ru",
      setLang: (lang) => set({ lang }),
      t: (key: string) => {
        const l = get().lang;
        return DICT[l]?.[key] || DICT["ru"][key] || key;
      },
    }),
    { name: "tatarcha-lang" },
  ),
);

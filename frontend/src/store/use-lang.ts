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
    partner: "Ресторан «Тюбетей» • Скидки за XP",
    partnerSub: "Обменивай баллы на скидки и эчпочмаки",
    askAkBars: "Спросить репетитора",
    level: "Уровень",
    reset: "Сбросить прогресс",
    language: "Язык интерфейса",
    mutedMode: "Беззвучный режим (озвучка ИИ)",
    on: "Вкл",
    off: "Выкл",
    welcome: "Салам, ученик! Бүген нәрсә өйрәнәбез?",
    platformTitle: "TatarLearn • Платформа",
    aiTutorCardTitle: "Ак Барс • ИИ-Репетитор",
    aiTutorCardDesc: "Задай вопрос по грамматике, переводи фразы или общайся голосом",
    startChat: "Спросить репетитора",
    lessonTreeTitle: "Древо уроков",
    lessonTreeDesc: "Выполнено сегодня",
    miniGamesTitle: "Мини-игры",
    miniGamesDesc: "Слова и квизы",
    lessonsTitle: "Уроки татарского",
    lessonsSubtitle: "Проходите уровни последовательно для лучших результатов",
    gamesMainTitle: "Мини-игры",
    gamesMainSubtitle: "Практика слов и грамматики в игровом формате",
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
    partner: "Tyubetey Restaurant • Discounts for XP",
    partnerSub: "Exchange points for discounts and echpochmaks",
    askAkBars: "Ask AI Tutor",
    level: "Level",
    reset: "Reset progress",
    language: "Interface Language",
    mutedMode: "Muted Mode (AI Voice)",
    on: "On",
    off: "Off",
    welcome: "Hello, student! What shall we learn today?",
    platformTitle: "TatarLearn • Platform",
    aiTutorCardTitle: "Ak Bars • AI Tutor",
    aiTutorCardDesc: "Ask grammar questions, translate phrases or practice speaking",
    startChat: "Ask AI Tutor",
    lessonTreeTitle: "Lessons Tree",
    lessonTreeDesc: "Completed today",
    miniGamesTitle: "Mini-Games",
    miniGamesDesc: "Vocabulary and quizzes",
    lessonsTitle: "Tatar Lessons",
    lessonsSubtitle: "Complete levels sequentially for best results",
    gamesMainTitle: "Mini-Games",
    gamesMainSubtitle: "Vocabulary and grammar practice in a game format",
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
    partnerSub: "Балларны ташламаларга алыштыр",
    askAkBars: "Репетитордан сора",
    level: "Дәрәҗә",
    reset: "Прогрессны чистарту",
    language: "Тел сайлау",
    mutedMode: "Тавышсыз режим (ИИ тавышы)",
    on: "Кабызырга",
    off: "Сүндерергә",
    welcome: "Сәлам! Бүген нәрсә өйрәнәбез?",
    platformTitle: "TatarLearn • Платформа",
    aiTutorCardTitle: "Ак Барс • ИИ-Репетитор",
    aiTutorCardDesc: "Грамматика буенча сорау бир, сүзләрне тәрҗемә ит яки сөйләш",
    startChat: "Репетитордан сора",
    lessonTreeTitle: "Дәресләр агачы",
    lessonTreeDesc: "Бүген үтелде",
    miniGamesTitle: "Мини-уеннар",
    miniGamesDesc: "Сүзләр һәм квизлар",
    lessonsTitle: "Татар теле дәресләре",
    lessonsSubtitle: "Яхшы нәтиҗә өчен дәрәҗәләрне узыгыз",
    gamesMainTitle: "Мини-уеннар",
    gamesMainSubtitle: "Уен форматында сүзләр һәм грамматика",
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

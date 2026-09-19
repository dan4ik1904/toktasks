"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CatState {
  mood: "happy" | "normal" | "hungry" | "sleeping" | "playing";
  hunger: number;
  outfit: string;
  exp: number;
  level: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

interface AppState {
  tgId: string;
  name: string;
  points: number;
  streak: number;
  lastDay: string;
  hearts: number;
  heartsAt: number;
  dailyTasks: number;
  dailyTasksDay: string;
  cat: CatState;
  completedTasks: string[];
  completedTopics: string[];
  achievements: Achievement[];
  shopPurchases: string[];

  setTgId: (id: string) => void;
  setName: (name: string) => void;
  addPoints: (n: number) => void;
  spendPoints: (n: number) => boolean;
  touchToday: () => void;
  completeTask: (taskId: string, points: number) => void;
  completeTopic: (topicSlug: string) => void;
  isTaskCompleted: (taskId: string) => boolean;
  isTopicCompleted: (topicSlug: string) => boolean;
  setHearts: (n: number) => void;
  spendHeart: () => boolean;
  refillHearts: () => void;
  feedCat: (foodId: string, hungerGain: number, mood: CatState["mood"]) => void;
  dressCat: (outfitId: string) => void;
  playWithCat: () => void;
  addCatExp: (n: number) => void;
  unlockAchievement: (id: string) => void;
  buyShopItem: (itemId: string) => boolean;
  syncFromServer: (data: Record<string, unknown>) => void;
  reset: () => void;
}

const MAX_HEARTS = 5;
const HEART_REGEN_MS = 20 * 60 * 1000;

const DEFAULT_CAT: CatState = {
  mood: "normal",
  hunger: 50,
  outfit: "default",
  exp: 0,
  level: 1,
};

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: "first-task", title: "Первый шаг", description: "Выполни первое задание", icon: "🎯", unlocked: false },
  { id: "streak-3", title: "На волне", description: "Серия 3 дня подряд", icon: "🔥", unlocked: false },
  { id: "streak-7", title: "Неделя без выходных", description: "Серия 7 дней", icon: "⚡", unlocked: false },
  { id: "points-100", title: "Сотня", description: "Набери 100 поинтов", icon: "💰", unlocked: false },
  { id: "points-500", title: "Коллекционер", description: "Набери 500 поинтов", icon: "👑", unlocked: false },
  { id: "cat-level-3", title: "Друг кота", description: "Кот достиг 3 уровня", icon: "🐱", unlocked: false },
  { id: "topic-5", title: "Полиглот", description: "Заверши 5 тем", icon: "📚", unlocked: false },
  { id: "first-shop", title: "Покупатель", description: "Купи первую вещь в магазине", icon: "🛍", unlocked: false },
  { id: "cat-feed-10", title: "Кормилец", description: "Покорми кота 10 раз", icon: "🍲", unlocked: false },
  { id: "all-topics", title: "Мастер языка", description: "Заверши все темы", icon: "🏆", unlocked: false },
];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function levelOf(points: number): number {
  return Math.min(50, Math.floor(points / 100) + 1);
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tgId: "demo",
      name: "Ученик",
      points: 0,
      streak: 0,
      lastDay: "",
      hearts: MAX_HEARTS,
      heartsAt: 0,
      dailyTasks: 0,
      dailyTasksDay: "",
      cat: { ...DEFAULT_CAT },
      completedTasks: [],
      completedTopics: [],
      achievements: [...DEFAULT_ACHIEVEMENTS],
      shopPurchases: [],

      setTgId: (id) => set({ tgId: id }),
      setName: (name) => set({ name }),

      addPoints: (n) => set((s) => {
        const newPoints = s.points + n;
        const newLevel = levelOf(newPoints);
        const achievements = [...s.achievements];
        if (newPoints >= 100) {
          const a = achievements.find((a) => a.id === "points-100");
          if (a && !a.unlocked) { a.unlocked = true; a.unlockedAt = Date.now(); }
        }
        if (newPoints >= 500) {
          const a = achievements.find((a) => a.id === "points-500");
          if (a && !a.unlocked) { a.unlocked = true; a.unlockedAt = Date.now(); }
        }
        return { points: newPoints, achievements };
      }),

      spendPoints: (n) => {
        const s = get();
        if (s.points < n) return false;
        set({ points: s.points - n });
        return true;
      },

      touchToday: () => set((s) => {
        const today = todayStr();
        if (s.lastDay === today) return {};
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const newStreak = s.lastDay === yesterday ? s.streak + 1 : 1;
        const achievements = [...s.achievements];
        if (newStreak >= 3) {
          const a = achievements.find((a) => a.id === "streak-3");
          if (a && !a.unlocked) { a.unlocked = true; a.unlockedAt = Date.now(); }
        }
        if (newStreak >= 7) {
          const a = achievements.find((a) => a.id === "streak-7");
          if (a && !a.unlocked) { a.unlocked = true; a.unlockedAt = Date.now(); }
        }
        return { lastDay: today, streak: newStreak, dailyTasks: 0, dailyTasksDay: today, achievements };
      }),

      completeTask: (taskId, points) => set((s) => {
        if (s.completedTasks.includes(taskId)) return {};
        const completedTasks = [...s.completedTasks, taskId];
        const newPoints = s.points + points;
        const today = todayStr();
        const dailyTasks = s.dailyTasksDay === today ? s.dailyTasks + 1 : 1;
        const achievements = [...s.achievements];
        if (completedTasks.length === 1) {
          const a = achievements.find((a) => a.id === "first-task");
          if (a && !a.unlocked) { a.unlocked = true; a.unlockedAt = Date.now(); }
        }
        return { completedTasks, points: newPoints, dailyTasks, dailyTasksDay: today, achievements };
      }),

      completeTopic: (topicSlug) => set((s) => {
        if (s.completedTopics.includes(topicSlug)) return {};
        const completedTopics = [...s.completedTopics, topicSlug];
        const achievements = [...s.achievements];
        if (completedTopics.length >= 5) {
          const a = achievements.find((a) => a.id === "topic-5");
          if (a && !a.unlocked) { a.unlocked = true; a.unlockedAt = Date.now(); }
        }
        if (completedTopics.length >= 15) {
          const a = achievements.find((a) => a.id === "all-topics");
          if (a && !a.unlocked) { a.unlocked = true; a.unlockedAt = Date.now(); }
        }
        return { completedTopics, achievements };
      }),

      isTaskCompleted: (taskId) => get().completedTasks.includes(taskId),
      isTopicCompleted: (topicSlug) => get().completedTopics.includes(topicSlug),

      setHearts: (n) => set({ hearts: Math.min(MAX_HEARTS, Math.max(0, n)) }),

      spendHeart: () => {
        const s = get();
        if (s.hearts <= 0) return false;
        set({ hearts: s.hearts - 1, heartsAt: Date.now() });
        return true;
      },

      refillHearts: () => set({ hearts: MAX_HEARTS }),

      feedCat: (foodId, hungerGain, mood) => set((s) => {
        const cat = { ...s.cat };
        cat.hunger = Math.min(100, cat.hunger + hungerGain);
        cat.mood = mood;
        cat.exp += 5;
        cat.level = levelOf(cat.exp);
        const achievements = [...s.achievements];
        if (cat.level >= 3) {
          const a = achievements.find((a) => a.id === "cat-level-3");
          if (a && !a.unlocked) { a.unlocked = true; a.unlockedAt = Date.now(); }
        }
        return { cat, achievements };
      }),

      dressCat: (outfitId) => set((s) => ({
        cat: { ...s.cat, outfit: outfitId },
      })),

      playWithCat: () => set((s) => ({
        cat: { ...s.cat, mood: "playing", exp: s.cat.exp + 3, level: levelOf(s.cat.exp + 3) },
      })),

      addCatExp: (n) => set((s) => ({
        cat: { ...s.cat, exp: s.cat.exp + n, level: levelOf(s.cat.exp + n) },
      })),

      unlockAchievement: (id) => set((s) => {
        const achievements = s.achievements.map((a) =>
          a.id === id && !a.unlocked ? { ...a, unlocked: true, unlockedAt: Date.now() } : a,
        );
        return { achievements };
      }),

      buyShopItem: (itemId) => {
        const s = get();
        if (s.shopPurchases.includes(itemId)) return false;
        set({ shopPurchases: [...s.shopPurchases, itemId] });
        const achievements = [...s.achievements];
        if (s.shopPurchases.length === 0) {
          const a = achievements.find((a) => a.id === "first-shop");
          if (a && !a.unlocked) { a.unlocked = true; a.unlockedAt = Date.now(); }
        }
        set({ achievements });
        return true;
      },

      syncFromServer: (data) => set((s) => ({
        points: (data.points as number) ?? s.points,
        streak: (data.streak as number) ?? s.streak,
        hearts: (data.hearts as number) ?? s.hearts,
      })),

      reset: () => set({
        points: 0,
        streak: 0,
        lastDay: "",
        hearts: MAX_HEARTS,
        heartsAt: 0,
        dailyTasks: 0,
        dailyTasksDay: "",
        cat: { ...DEFAULT_CAT },
        completedTasks: [],
        completedTopics: [],
        achievements: [...DEFAULT_ACHIEVEMENTS],
        shopPurchases: [],
      }),
    }),
    { name: "tatarcha-store" },
  ),
);

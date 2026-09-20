"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProficiencyLevel } from "@/components/placement-modal";
import { TOPICS } from "@/data/topics";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface AppState {
  tgId: string;
  name: string;
  points: number;
  streak: number;
  lastDay: string;
  dailyTasks: number;
  dailyTasksDay: string;
  completedTasks: string[];
  completedTopics: string[];
  achievements: Achievement[];
  shopPurchases: string[];
  gamesPlayed: number;
  userLevel: ProficiencyLevel | null;
  muted: boolean;
  /** Показана ли подсказка про татарскую клавиатуру (только один раз). */
  kbdHintShown: boolean;
  chatMessages: ChatMessage[];

  setTgId: (id: string) => void;
  setName: (name: string) => void;
  setUserLevel: (lvl: ProficiencyLevel | null) => void;
  addPoints: (n: number) => void;
  spendPoints: (n: number) => boolean;
  touchToday: () => void;
  completeTask: (taskId: string, points: number) => void;
  completeTopic: (topicSlug: string) => void;
  isTaskCompleted: (taskId: string) => boolean;
  isTopicCompleted: (topicSlug: string) => boolean;
  buyShopItem: (itemId: string) => boolean;
  registerGame: () => void;
  unlockAchievement: (id: string) => void;
  toggleMute: () => void;
  setKbdHintShown: () => void;
  setChatMessages: (msgs: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  /** Полное применение снапшота из БД (per-TG-аккаунт). Не трогает tgId/name. */
  applyServerSnapshot: (data: Record<string, unknown>) => void;
  /** Сброс данных профиля (при смене TG-аккаунта). tgId/name сохраняет. */
  resetProfileData: () => void;
  profileReady: boolean;
  setProfileReady: (v: boolean) => void;
  reset: () => void;
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: "first-task", title: "Первый шаг", description: "Выполни первое задание", icon: "🎯", unlocked: false },
  { id: "streak-3", title: "На волне", description: "Серия 3 дня подряд", icon: "🔥", unlocked: false },
  { id: "streak-7", title: "Неделя без выходных", description: "Серия 7 дней", icon: "⚡", unlocked: false },
  { id: "points-100", title: "Сотня", description: "Набери 100 поинтов", icon: "💰", unlocked: false },
  { id: "points-500", title: "Коллекционер", description: "Набери 500 поинтов", icon: "👑", unlocked: false },
  { id: "topic-5", title: "Полиглот", description: "Заверши 5 тем", icon: "📚", unlocked: false },
  { id: "all-topics", title: "Мастер языка", description: "Заверши все темы", icon: "🏆", unlocked: false },
];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const LEVELS = ["beginner", "elementary", "intermediate", "advanced"] as const;

function strArray(v: unknown, limit: number): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string").slice(0, limit);
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

const GREETING: ChatMessage = {
  role: "assistant",
  text: "Иминлек! Мин — Иптәш, твой ИИ-помощник в изучении татарского языка. Спроси меня о чем угодно, переводи фразы или общайся на любые темы!",
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tgId: "demo",
      name: "Ученик",
      points: 0,
      streak: 0,
      lastDay: "",
      dailyTasks: 0,
      dailyTasksDay: "",
      completedTasks: [],
      completedTopics: [],
      achievements: [...DEFAULT_ACHIEVEMENTS],
      shopPurchases: [],
      gamesPlayed: 0,
      userLevel: null,
      muted: false,
      kbdHintShown: false,
      chatMessages: [
        {
          role: "assistant",
          text: "Иминлек! Мин — Иптәш, твой ИИ-помощник в изучении татарского языка. Спроси меня о чем угодно, переводи фразы или общайся на любые темы!",
        },
      ],

      setTgId: (id) => set({ tgId: id }),
      setName: (name) => set({ name }),
      setUserLevel: (userLevel) => set({ userLevel }),
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      setKbdHintShown: () => set({ kbdHintShown: true }),
      setChatMessages: (msgs) => set((s) => ({
        chatMessages: typeof msgs === "function" ? msgs(s.chatMessages) : msgs,
      })),

      addPoints: (n) => set((s) => {
        const newPoints = s.points + n;
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
        if (completedTopics.length >= TOPICS.length) {
          const a = achievements.find((a) => a.id === "all-topics");
          if (a && !a.unlocked) { a.unlocked = true; a.unlockedAt = Date.now(); }
        }
        return { completedTopics, achievements };
      }),

      isTaskCompleted: (taskId) => get().completedTasks.includes(taskId),
      isTopicCompleted: (topicSlug) => get().completedTopics.includes(topicSlug),

      buyShopItem: (itemId) => {
        const s = get();
        if (s.shopPurchases.includes(itemId)) return false;
        set({ shopPurchases: [...s.shopPurchases, itemId] });
        return true;
      },

      registerGame: () => set((s) => ({ gamesPlayed: s.gamesPlayed + 1 })),

      unlockAchievement: (id) => set((s) => {
        const achievements = s.achievements.map((a) =>
          a.id === id && !a.unlocked ? { ...a, unlocked: true, unlockedAt: Date.now() } : a,
        );
        return { achievements };
      }),

      applyServerSnapshot: (data) => set((s) => {
        const lvl = (LEVELS as readonly string[]).includes(data.userLevel as string)
          ? (data.userLevel as ProficiencyLevel)
          : s.userLevel;
        const achievements = [...DEFAULT_ACHIEVEMENTS];
        if (Array.isArray(data.achievements)) {
          for (const a of data.achievements as Array<{ id?: string; unlocked?: boolean; unlockedAt?: number }>) {
            const cur = achievements.find((x) => x.id === a?.id);
            if (cur && a?.unlocked) {
              cur.unlocked = true;
              cur.unlockedAt = typeof a.unlockedAt === "number" ? a.unlockedAt : Date.now();
            }
          }
        }
        let chatMessages = s.chatMessages;
        if (Array.isArray(data.chatMessages)) {
          const msgs = (data.chatMessages as unknown[]).filter(
            (m): m is ChatMessage =>
              !!m && typeof m === "object" &&
              ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
              typeof (m as ChatMessage).text === "string",
          ).slice(-40);
          if (msgs.length > 0) chatMessages = msgs;
        }
        return {
          points: num(data.points, s.points),
          streak: num(data.streak, s.streak),
          lastDay: typeof data.lastDay === "string" ? data.lastDay : s.lastDay,
          dailyTasks: num(data.dailyTasks, s.dailyTasks),
          dailyTasksDay: typeof data.dailyTasksDay === "string" ? data.dailyTasksDay : s.dailyTasksDay,
          completedTasks: strArray(data.completedTasks, 2000),
          completedTopics: strArray(data.completedTopics, 500),
          achievements,
          shopPurchases: strArray(data.shopPurchases, 500),
          gamesPlayed: num(data.gamesPlayed, s.gamesPlayed),
          userLevel: lvl,
          muted: typeof data.muted === "boolean" ? data.muted : s.muted,
          kbdHintShown: data.kbdHintShown === true ? true : s.kbdHintShown,
          chatMessages,
        };
      }),

      resetProfileData: () => set((s) => ({
        points: 0,
        streak: 0,
        lastDay: "",
        dailyTasks: 0,
        dailyTasksDay: "",
        completedTasks: [],
        completedTopics: [],
        achievements: [...DEFAULT_ACHIEVEMENTS],
        shopPurchases: [],
        gamesPlayed: 0,
        userLevel: null,
        muted: false,
        kbdHintShown: false,
        chatMessages: [GREETING],
        tgId: s.tgId,
        name: s.name,
      })),

      profileReady: false,
      setProfileReady: (v) => set({ profileReady: v }),

      reset: () => set({
        points: 0,
        streak: 0,
        lastDay: "",
        dailyTasks: 0,
        dailyTasksDay: "",
        completedTasks: [],
        completedTopics: [],
        achievements: [...DEFAULT_ACHIEVEMENTS],
        shopPurchases: [],
        gamesPlayed: 0,
        userLevel: null,
      }),
    }),
    {
      name: "tatarcha-store",
      // КРИТИЧНО: localStorage общий на устройство. Если в сохранённых
      // данных чужой tgId — игнорируем их, иначе новый аккаунт увидит
      // старый прогресс (и пропущенное входное тестирование).
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState> | undefined;
        const c = current as AppState;
        if (p && typeof p.tgId === "string" && p.tgId && p.tgId !== c.tgId) {
          return c;
        }
        return { ...c, ...(p ?? {}) };
      },
    },
  ),
);

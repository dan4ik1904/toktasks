import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ServerProfile {
  xp: number;
  streak: number;
  hearts: number;
  lessons: string[];
}

interface ProgressState {
  xp: number;
  completedLessons: string[];
  streak: number;
  lastDay: string;
  hearts: number;
  tgId: string;
  serverReady: boolean;
  completeLesson: (lessonId: string, xpGain?: number) => void;
  isCompleted: (lessonId: string) => boolean;
  touchToday: () => void;
  applyServer: (tgId: string, p: ServerProfile) => void;
  setHearts: (hearts: number) => void;
  reset: () => void;
}

export const XP_PER_LESSON = 20;
const XP_PER_LEVEL = 100;
export const MAX_HEARTS = 5;

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function levelOf(xp: number): { level: number; title: string; into: number } {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const titles = ["Башлаучы", "Өйрәнүче", "Белгеч", "Остаз", "Хан"];
  return {
    level,
    title: titles[Math.min(level - 1, titles.length - 1)],
    into: xp % XP_PER_LEVEL,
  };
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      xp: 0,
      completedLessons: [],
      streak: 0,
      lastDay: "",
      hearts: MAX_HEARTS,
      tgId: "",
      serverReady: false,
      completeLesson: (lessonId, xpGain = XP_PER_LESSON) => {
        if (get().completedLessons.includes(lessonId)) return;
        set((s) => ({
          xp: s.xp + xpGain,
          completedLessons: [...s.completedLessons, lessonId],
        }));
        get().touchToday();
      },
      isCompleted: (lessonId) => get().completedLessons.includes(lessonId),
      touchToday: () => {
        const today = todayKey();
        const { lastDay, streak } = get();
        if (lastDay === today) return;
        const y = new Date();
        y.setDate(y.getDate() - 1);
        set({
          lastDay: today,
          streak: lastDay === todayKey(y) ? streak + 1 : 1,
          hearts: MAX_HEARTS,
        });
      },
      // Сервер — источник правды: заливаем профиль после register/me/progress.
      applyServer: (tgId, p) =>
        set((s) => ({
          tgId,
          serverReady: true,
          xp: Math.max(s.xp, p.xp),
          streak: Math.max(s.streak, p.streak),
          hearts: p.hearts,
          completedLessons: Array.from(new Set([...s.completedLessons, ...p.lessons])),
        })),
      setHearts: (hearts) => set({ hearts }),
      reset: () =>
        set({ xp: 0, completedLessons: [], streak: 0, lastDay: "", hearts: MAX_HEARTS }),
    }),
    { name: "tatar-uku-progress" },
  ),
);

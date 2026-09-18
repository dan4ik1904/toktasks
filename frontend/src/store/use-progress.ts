import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProgressState {
  xp: number;
  completedLessons: string[];
  streak: number;
  lastDay: string;
  completeLesson: (lessonId: string, xpGain?: number) => void;
  isCompleted: (lessonId: string) => boolean;
  touchToday: () => void;
  reset: () => void;
}

export const XP_PER_LESSON = 20;
const XP_PER_LEVEL = 100;

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
        set({ lastDay: today, streak: lastDay === todayKey(y) ? streak + 1 : 1 });
      },
      reset: () => set({ xp: 0, completedLessons: [], streak: 0, lastDay: "" }),
    }),
    { name: "tatar-uku-progress" },
  ),
);

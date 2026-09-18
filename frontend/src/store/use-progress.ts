import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProgressState {
  xp: number;
  completedLessons: string[];
  completeLesson: (lessonId: string, xpGain?: number) => void;
  isCompleted: (lessonId: string) => boolean;
  reset: () => void;
}

export const XP_PER_LESSON = 20;

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      xp: 0,
      completedLessons: [],
      completeLesson: (lessonId, xpGain = XP_PER_LESSON) => {
        if (get().completedLessons.includes(lessonId)) return;
        set((s) => ({
          xp: s.xp + xpGain,
          completedLessons: [...s.completedLessons, lessonId],
        }));
      },
      isCompleted: (lessonId) => get().completedLessons.includes(lessonId),
      reset: () => set({ xp: 0, completedLessons: [] }),
    }),
    { name: "tatar-uku-progress" },
  ),
);

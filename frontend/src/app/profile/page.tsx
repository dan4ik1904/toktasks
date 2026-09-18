"use client";

import Link from "next/link";
import { Bot, Flame, RotateCcw, Trophy } from "lucide-react";
import { ISLANDS } from "@/data/islands";
import { levelOf, useProgress } from "@/store/use-progress";
import { Progress } from "@/components/ui/progress";

export default function ProfilePage() {
  const xp = useProgress((s) => s.xp);
  const streak = useProgress((s) => s.streak);
  const completedLessons = useProgress((s) => s.completedLessons);
  const reset = useProgress((s) => s.reset);
  const { level, title, into } = levelOf(xp);
  const totalLessons = ISLANDS.reduce((n, isl) => n + isl.lessons.length, 0);

  return (
    <main className="flex w-full flex-1 flex-col gap-4 px-4 pt-4 pb-6">
      <section className="flex flex-col items-center gap-2 rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80 p-6 text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[#f5c044] to-[#0e9f6e] text-3xl font-bold text-[#04150f]">
          А
        </span>
        <h1 className="text-xl font-bold">Айгуль</h1>
        <p className="text-sm text-[#f5c044]">
          {level} уровень · {title}
        </p>
        <Progress value={into} max={100} className="mt-1 w-40" />
        <p className="flex items-center gap-3 text-sm text-[#9db8a8]">
          <span className="inline-flex items-center gap-1">
            <Trophy className="size-4 text-[#f5c044]" aria-hidden />
            {completedLessons.length}/{totalLessons} уроков
          </span>
          <span className="inline-flex items-center gap-1">
            <Flame className="size-4 text-orange-300" aria-hidden />
            {streak} дн. подряд
          </span>
        </p>
      </section>

      <Link
        href="/assistant"
        className="flex items-center gap-3 rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80 p-4"
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#0e9f6e] text-white">
          <Bot className="size-6" aria-hidden />
        </span>
        <span>
          <span className="block font-semibold">Ярдәмче</span>
          <span className="block text-sm text-[#9db8a8]">
            ИИ-помощник по татарскому
          </span>
        </span>
      </Link>

      <button
        onClick={() => {
          if (window.confirm("Сбросить весь прогресс и XP?")) reset();
        }}
        className="flex items-center justify-center gap-2 rounded-2xl border border-[#1c4d3a] p-3 text-sm text-[#9db8a8] hover:bg-white/5"
      >
        <RotateCcw className="size-4" aria-hidden />
        Сбросить прогресс
      </button>

      <p className="text-center text-xs text-[#9db8a8]">
        Татар.Уку · прогресс дублируется на сервер, если он доступен
      </p>
    </main>
  );
}

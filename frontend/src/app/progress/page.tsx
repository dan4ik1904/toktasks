"use client";

import { Flame, Sparkles, Trophy } from "lucide-react";
import { ISLANDS, islandProgress } from "@/data/islands";
import { useProgress, XP_PER_LESSON } from "@/store/use-progress";
import { IslandIcon } from "@/components/island-icon";

export default function ProgressPage() {
  const { xp, completedLessons } = useProgress();
  const totalLessons = ISLANDS.reduce((n, isl) => n + isl.lessons.length, 0);
  const overall =
    totalLessons === 0 ? 0 : Math.round((completedLessons.length / totalLessons) * 100);

  return (
    <main className="flex w-full flex-1 flex-col gap-4 px-4 pt-4 pb-6">
      <h1 className="text-2xl font-bold">Прогресс</h1>

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80 p-3 text-center">
          <Sparkles className="mx-auto size-5 text-[#f5c044]" aria-hidden />
          <p className="pt-1 text-xl font-bold tabular-nums">{xp}</p>
          <p className="text-xs text-[#9db8a8]">XP</p>
        </div>
        <div className="rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80 p-3 text-center">
          <Trophy className="mx-auto size-5 text-[#f5c044]" aria-hidden />
          <p className="pt-1 text-xl font-bold tabular-nums">
            {completedLessons.length}/{totalLessons}
          </p>
          <p className="text-xs text-[#9db8a8]">уроков</p>
        </div>
        <div className="rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80 p-3 text-center">
          <Flame className="mx-auto size-5 text-[#34d399]" aria-hidden />
          <p className="pt-1 text-xl font-bold tabular-nums">
            {Math.floor(xp / XP_PER_LESSON)}
          </p>
          <p className="text-xs text-[#9db8a8]">наград</p>
        </div>
      </section>

      <section className="rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80 p-4">
        <p className="text-sm">Всего пройдено: {overall}%</p>
        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={overall}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#34d399] to-[#f5c044]"
            style={{ width: `${overall}%` }}
          />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        {ISLANDS.map((island) => {
          const p = islandProgress(island, completedLessons);
          return (
            <div
              key={island.slug}
              className="flex items-center gap-3 rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80 p-3"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#f5c044]">
                <IslandIcon icon={island.icon} className="size-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">{island.title}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#34d399]"
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-[#9db8a8] tabular-nums">
                {p.done}/{p.total}
              </span>
            </div>
          );
        })}
      </section>
    </main>
  );
}

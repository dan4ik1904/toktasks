"use client";

import { useEffect, useState } from "react";
import { Flame, Sparkles, Trophy } from "lucide-react";
import { ISLANDS, islandProgress } from "@/data/islands";
import { useProgress, XP_PER_LESSON } from "@/store/use-progress";
import { IslandIcon } from "@/components/island-icon";
import { fetchStatsApi } from "@/lib/auth";

export default function ProgressPage() {
  const { xp, completedLessons } = useProgress();
  const totalLessons = ISLANDS.reduce((n, isl) => n + isl.lessons.length, 0);
  const overall =
    totalLessons === 0 ? 0 : Math.round((completedLessons.length / totalLessons) * 100);

  const [platformStats, setPlatformStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void fetchStatsApi().then(setPlatformStats);
  }, []);

  return (
    <main className="flex w-full flex-1 flex-col gap-4 px-4 pt-4 pb-6">
      <h1 className="text-2xl font-bold">Прогресс</h1>

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 text-center">
          <Sparkles className="mx-auto size-5 text-[var(--gold)]" aria-hidden />
          <p className="pt-1 text-xl font-bold tabular-nums">{xp}</p>
          <p className="text-xs text-[var(--muted)]">XP</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 text-center">
          <Trophy className="mx-auto size-5 text-[var(--gold)]" aria-hidden />
          <p className="pt-1 text-xl font-bold tabular-nums">
            {completedLessons.length}/{totalLessons}
          </p>
          <p className="text-xs text-[var(--muted)]">уроков</p>
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 text-center">
          <Flame className="mx-auto size-5 text-[var(--accent)]" aria-hidden />
          <p className="pt-1 text-xl font-bold tabular-nums">
            {Math.floor(xp / XP_PER_LESSON)}
          </p>
          <p className="text-xs text-[var(--muted)]">наград</p>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
        <p className="text-sm">Всего пройдено: {overall}%</p>
        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--track)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={overall}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--gold)]"
            style={{ width: `${overall}%` }}
          />
        </div>
      </section>

      {platformStats && (
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-sm font-bold">Статистика платформы</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[var(--muted)]">
            <span>Учеников: <b className="text-[var(--fg)] tabular-nums">{(platformStats.total_users as number) ?? 0}</b></span>
            <span>уроков пройдено: <b className="text-[var(--fg)] tabular-nums">{(platformStats.total_lessons_completed as number) ?? 0}</b></span>
            <span>Активных сегодня: <b className="text-[var(--fg)] tabular-nums">{(platformStats.active_today as number) ?? 0}</b></span>
            <span>за неделю: <b className="text-[var(--fg)] tabular-nums">{(platformStats.active_this_week as number) ?? 0}</b></span>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        {ISLANDS.map((island) => {
          const p = islandProgress(island, completedLessons);
          return (
            <div
              key={island.slug}
              className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold)]">
                <IslandIcon icon={island.icon} className="size-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">{island.title}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--track)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-[var(--muted)] tabular-nums">
                {p.done}/{p.total}
              </span>
            </div>
          );
        })}
      </section>
    </main>
  );
}

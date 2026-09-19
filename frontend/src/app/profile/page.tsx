"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bot, Flame, RotateCcw, Trophy } from "lucide-react";
import { ISLANDS } from "@/data/islands";
import { levelOf, useProgress } from "@/store/use-progress";
import { Progress } from "@/components/ui/progress";
import { useTelegram } from "@/providers/telegram-provider";
import { fetchStatsApi } from "@/lib/api";

export default function ProfilePage() {
  const xp = useProgress((s) => s.xp);
  const streak = useProgress((s) => s.streak);
  const completedLessons = useProgress((s) => s.completedLessons);
  const reset = useProgress((s) => s.reset);
  const { user } = useTelegram();
  const { level, title, into } = levelOf(xp);
  const totalLessons = ISLANDS.reduce((n, isl) => n + isl.lessons.length, 0);

  const [platformStats, setPlatformStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void fetchStatsApi().then(setPlatformStats);
  }, []);

  const displayName = user?.first_name ?? "Айгуль";

  return (
    <main className="flex w-full flex-1 flex-col gap-4 px-4 pt-4 pb-6">
      <section className="flex flex-col items-center gap-2 rounded-[1.75rem] border border-[var(--line)] bg-[var(--surface)] p-6 text-center">
        <span className="avatar-seal flex size-20 items-center justify-center rounded-full text-3xl font-black">
          {displayName.slice(0, 1)}
        </span>
        <h1 className="text-xl font-bold">{displayName}</h1>
        {user?.username && (
          <p className="text-xs text-[var(--muted)]">@{user.username}</p>
        )}
        <p className="text-sm font-bold text-[var(--gold)]">
          {level} уровень · {title}
        </p>
        <Progress value={into} max={100} className="mt-1 w-40" />
        <p className="flex items-center gap-3 text-sm text-[var(--muted)]">
          <span className="inline-flex items-center gap-1">
            <Trophy className="size-4 text-[var(--gold)]" aria-hidden />
            {completedLessons.length}/{totalLessons} уроков
          </span>
          <span className="inline-flex items-center gap-1">
            <Flame className="size-4 text-[var(--terracotta)]" aria-hidden />
            {streak} дн. подряд
          </span>
        </p>
      </section>

      {platformStats && (
        <section className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 text-sm font-bold">Платформа</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[var(--muted)]">Учеников</p>
              <p className="font-bold tabular-nums">{(platformStats.total_users as number) ?? 0}</p>
            </div>
            <div>
              <p className="text-[var(--muted)]">уроков пройдено</p>
              <p className="font-bold tabular-nums">{(platformStats.total_lessons_completed as number) ?? 0}</p>
            </div>
            <div>
              <p className="text-[var(--muted)]">Активных сегодня</p>
              <p className="font-bold tabular-nums">{(platformStats.active_today as number) ?? 0}</p>
            </div>
            <div>
              <p className="text-[var(--muted)]">Топ XP</p>
              <p className="font-bold tabular-nums">{(platformStats.top_xp as number) ?? 0}</p>
            </div>
          </div>
        </section>
      )}

      <Link
        href="/assistant"
        className="flex items-center gap-3 rounded-[1.75rem] border border-[var(--line)] bg-[var(--surface)] p-4"
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
          <Bot className="size-6" aria-hidden />
        </span>
        <span>
          <span className="block font-semibold">Ярдәмче</span>
          <span className="block text-sm text-[var(--muted)]">
            ИИ-помощник по татарскому
          </span>
        </span>
      </Link>

      <button
        onClick={() => {
          if (window.confirm("Сбросить весь прогресс и XP?")) reset();
        }}
        className="flex items-center justify-center gap-2 rounded-[1.75rem] border border-[var(--line)] p-3 text-sm text-[var(--muted)] hover:bg-[var(--surface-2)]"
      >
        <RotateCcw className="size-4" aria-hidden />
        Сбросить прогресс
      </button>

      <p className="text-center text-xs text-[var(--muted)]">
        Татар.Уку · прогресс дублируется на сервер, если он доступен
      </p>
    </main>
  );
}

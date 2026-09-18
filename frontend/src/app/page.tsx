"use client";

import Link from "next/link";
import { Check, Lock, LockOpen, Settings } from "lucide-react";
import { ISLANDS, islandProgress, islandStatus } from "@/data/islands";
import { useTelegram } from "@/providers/telegram-provider";
import { useProgress } from "@/store/use-progress";
import { IslandIcon } from "@/components/island-icon";
import { cn } from "@/lib/utils";

const ART = [
  "from-[#f5c044]/40 via-[#0d3a2b] to-[#04150f]",
  "from-[#34d399]/35 via-[#0d3a2b] to-[#04150f]",
  "from-[#f59e0b]/35 via-[#0d3a2b] to-[#04150f]",
  "from-[#2dd4bf]/30 via-[#0d3a2b] to-[#04150f]",
  "from-[#a3e635]/25 via-[#0d3a2b] to-[#04150f]",
  "from-[#fbbf24]/30 via-[#0d3a2b] to-[#04150f]",
];

export default function Home() {
  const completedLessons = useProgress((s) => s.completedLessons);
  const { user } = useTelegram();
  const displayName = user?.first_name ?? "Айгуль";

  const doneIslands = ISLANDS.filter(
    (_, i) => islandStatus(i, completedLessons) === "done",
  ).length;
  const totalLessons = ISLANDS.reduce((n, isl) => n + isl.lessons.length, 0);
  const doneLessons = completedLessons.length;
  const overall = totalLessons === 0 ? 0 : Math.round((doneLessons / totalLessons) * 100);

  return (
    <main className="flex w-full flex-1 flex-col gap-4 px-4 pt-4 pb-6">
      {/* Профиль */}
      <section className="flex items-center gap-3 rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80 p-3">
        <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#f5c044] to-[#0e9f6e] text-xl font-bold text-[#04150f]">
          {displayName.slice(0, 1)}
        </span>
        <div className="flex-1">
          <p className="font-semibold">{displayName}</p>
          <p className="text-sm text-[#9db8a8]">
            {doneIslands}/{ISLANDS.length} островов
          </p>
        </div>
        <Link
          href="/profile"
          aria-label="Настройки профиля"
          className="flex size-10 items-center justify-center rounded-full text-[#9db8a8] hover:bg-white/5"
        >
          <Settings className="size-5" aria-hidden />
        </Link>
      </section>

      {/* Общий прогресс */}
      <section className="rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80 p-4">
        <p className="text-sm">
          Ты прошёл {doneIslands} из {ISLANDS.length} островов
        </p>
        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={overall}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#34d399] to-[#f5c044] transition-all"
            style={{ width: `${overall}%` }}
          />
        </div>
      </section>

      {/* Острова */}
      <section className="grid grid-cols-2 gap-3">
        {ISLANDS.map((island, i) => {
          const status = islandStatus(i, completedLessons);
          const p = islandProgress(island, completedLessons);
          const locked = status === "locked";
          const card = (
            <article
              className={cn(
                "flex h-full flex-col overflow-hidden rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80",
                status === "done" && "glow-gold",
                status === "open" && "glow-green",
                locked && "opacity-60",
              )}
            >
              <div
                className={cn(
                  "relative flex h-28 items-center justify-center bg-gradient-to-b",
                  ART[i % ART.length],
                )}
              >
                <IslandIcon
                  icon={island.icon}
                  className="size-14 text-[#f5c044] drop-shadow-[0_0_12px_rgba(245,192,68,0.5)]"
                />
                {status === "done" && (
                  <span className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-[#f5c044] text-[#04150f]">
                    <Check className="size-4" aria-label="Пройден" />
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <h2 className="font-semibold">{island.title}</h2>
                <p className="text-xs text-[#9db8a8]">{island.guide}</p>
                <span
                  className={cn(
                    "mt-1 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    status === "done" && "bg-[#f5c044]/15 text-[#f5c044]",
                    status === "open" && "bg-[#34d399]/15 text-[#34d399]",
                    locked && "bg-white/10 text-[#9db8a8]",
                  )}
                >
                  {status === "done" ? (
                    <Check className="size-3.5" aria-hidden />
                  ) : status === "open" ? (
                    <LockOpen className="size-3.5" aria-hidden />
                  ) : (
                    <Lock className="size-3.5" aria-hidden />
                  )}
                  {status === "done"
                    ? "Пройден"
                    : status === "open"
                      ? "Доступен"
                      : "Закрыт"}
                </span>
                <div className="mt-auto flex items-center gap-2 pt-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        status === "done"
                          ? "bg-[#f5c044]"
                          : "bg-gradient-to-r from-[#34d399] to-[#f5c044]",
                      )}
                      style={{ width: `${p.pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-[#9db8a8] tabular-nums">
                    {p.pct}%
                  </span>
                </div>
              </div>
            </article>
          );
          return locked ? (
            <div key={island.slug}>{card}</div>
          ) : (
            <Link key={island.slug} href={`/island/${island.slug}`}>
              {card}
            </Link>
          );
        })}
      </section>
    </main>
  );
}

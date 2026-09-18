"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { ISLANDS, islandProgress, islandStatus } from "@/data/islands";
import { useTelegram } from "@/providers/telegram-provider";
import { useProgress } from "@/store/use-progress";
import { IslandCard } from "@/components/island-card";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const completedLessons = useProgress((s) => s.completedLessons);
  const { user } = useTelegram();
  const displayName = user?.first_name ?? "Айгуль";

  const doneIslands = ISLANDS.filter(
    (_, i) => islandStatus(i, completedLessons) === "done",
  ).length;
  const totalLessons = ISLANDS.reduce((n, isl) => n + isl.lessons.length, 0);

  return (
    <main className="flex w-full flex-1 flex-col gap-4 px-4 pt-4 pb-6">
      {/* 1. Хедер: аватар, имя, счёт островов */}
      <motion.section
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80 p-3"
      >
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
      </motion.section>

      {/* 2. Прогресс-бар с градиентом */}
      <section className="rounded-2xl border border-[#1c4d3a] bg-[#0a2e23]/80 p-4">
        <p className="text-sm">
          Ты прошёл {doneIslands} из {ISLANDS.length} островов
        </p>
        <Progress
          value={completedLessons.length}
          max={totalLessons}
          className="mt-2 h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-[#34d399] [&>div]:to-[#f5c044]"
        />
      </section>

      {/* 3. Сетка островов */}
      <section className="grid grid-cols-2 gap-3">
        {ISLANDS.map((island, i) => {
          const status = islandStatus(i, completedLessons);
          const p = islandProgress(island, completedLessons);
          const card = (
            <IslandCard
              island={island}
              status={status}
              done={p.done}
              total={p.total}
              pct={p.pct}
              index={i}
            />
          );
          return status === "locked" ? (
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

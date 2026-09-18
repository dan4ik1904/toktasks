"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpenText, Flame, Settings, Target, Volume2, Zap } from "lucide-react";
import { ISLANDS, islandProgress, islandStatus } from "@/data/islands";
import { ttsSpeak } from "@/lib/api";
import { useTelegram } from "@/providers/telegram-provider";
import { levelOf, MAX_HEARTS, useProgress } from "@/store/use-progress";
import { IslandCard } from "@/components/island-card";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const completedLessons = useProgress((s) => s.completedLessons);
  const xp = useProgress((s) => s.xp);
  const streak = useProgress((s) => s.streak);
  const hearts = useProgress((s) => s.hearts);
  const { user } = useTelegram();
  const displayName = user?.first_name ?? "Айгуль";
  const { title: levelTitle } = levelOf(xp);

  // Слово дня: детерминировано датой, одинаково на сервере и клиенте.
  const wordOfDay = useMemo(() => {
    const all: { tt: string; ru: string; island: string }[] = [];
    for (const isl of ISLANDS) {
      for (const l of isl.lessons) {
        for (const w of l.words) all.push({ tt: w.tt, ru: w.ru, island: isl.title });
      }
    }
    const day = Math.floor(Date.now() / 86400000);
    return all[day % all.length];
  }, []);

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
        className="flex items-center gap-3 rounded-2xl border border-[#3a3370] bg-[#1d1747]/80 p-3"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ffc800] to-[#7c5cff] text-xl font-bold text-[#120e2b]">
          {displayName.slice(0, 1)}
        </span>
        <div className="flex-1">
          <p className="font-semibold">{displayName}</p>
          <p className="text-sm text-[#a7a2c9]">
            {doneIslands}/{ISLANDS.length} островов · {levelTitle}
          </p>
        </div>
        {streak > 0 && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-bold text-orange-300"
            title="Дней подряд"
          >
            <Flame className="size-3.5" aria-hidden />
            {streak}
          </span>
        )}
        <span
          className="inline-flex items-center gap-1 rounded-full bg-[#ffc800]/15 px-2.5 py-1 text-xs font-bold text-[#ffc800]"
          title="Очки опыта"
        >
          <Zap className="size-3.5" aria-hidden />
          {xp}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-300"
          title={`Сердца: ${hearts} из ${MAX_HEARTS}`}
        >
          <span aria-hidden>❤️</span>
          {hearts}
        </span>
        <Link
          href="/profile"
          aria-label="Настройки профиля"
          className="flex size-10 items-center justify-center rounded-full text-[#a7a2c9] hover:bg-white/5"
        >
          <Settings className="size-5" aria-hidden />
        </Link>
      </motion.section>

      {/* 2. Прогресс-бар с градиентом */}
      <section className="rounded-2xl border border-[#3a3370] bg-[#1d1747]/80 p-4">
        <p className="text-sm">
          Ты прошёл {doneIslands} из {ISLANDS.length} островов
        </p>
        <Progress
          value={completedLessons.length}
          max={totalLessons}
          className="mt-2 h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-[#58cc02] [&>div]:to-[#ffc800]"
        />
      </section>

      {/* Слово дня */}
      <section className="flex items-center gap-3 rounded-2xl border border-[#ffc800]/40 bg-gradient-to-r from-[#ffc800]/10 to-transparent p-4">
        <div className="flex-1">
          <p className="text-xs tracking-wide text-[#ffc800] uppercase">
            Сүз · слово дня · {wordOfDay.island}
          </p>
          <p className="pt-0.5 text-lg font-bold">{wordOfDay.tt}</p>
          <p className="text-sm text-[#a7a2c9]">{wordOfDay.ru}</p>
        </div>
        <button
          onClick={() => void ttsSpeak(wordOfDay.tt)}
          aria-label={`Озвучить: ${wordOfDay.tt}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#ffc800] text-[#120e2b]"
        >
          <Volume2 className="size-5" aria-hidden />
        </button>
      </section>

      {/* Квесты дня */}
      <section className="rounded-2xl border border-[#3a3370] bg-[#1d1747]/80 p-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Target className="size-4 text-[#ffc800]" aria-hidden />
          Квесты дня
        </p>
        <div className="flex flex-col gap-2.5 pt-3">
          {[
            {
              label: "Пройди 3 урока",
              done: Math.min(completedLessons.length, 3),
              total: 3,
            },
            {
              label: "Набери 100 XP",
              done: Math.min(xp, 100),
              total: 100,
            },
            {
              label: "Серия 3 дня",
              done: Math.min(streak, 3),
              total: 3,
            },
          ].map((q) => (
            <div key={q.label}>
              <div className="flex items-center justify-between text-xs">
                <span className={q.done >= q.total ? "text-[#58cc02]" : ""}>
                  {q.done >= q.total ? "✅ " : ""}
                  {q.label}
                </span>
                <span className="text-[#a7a2c9] tabular-nums">
                  {q.done}/{q.total}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#58cc02] to-[#ffc800]"
                  style={{ width: `${(q.done / q.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Словарь */}
      <Link
        href="/dictionary"
        className="flex items-center gap-3 rounded-2xl border border-[#3a3370] bg-[#1d1747]/80 p-4"
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#7c5cff]/20 text-[#7c5cff]">
          <BookOpenText className="size-6" aria-hidden />
        </span>
        <span>
          <span className="block font-semibold">Словарь</span>
          <span className="block text-sm text-[#a7a2c9]">
            Все слова островов с озвучкой
          </span>
        </span>
      </Link>

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

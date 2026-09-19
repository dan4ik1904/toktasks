"use client";

import Link from "next/link";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpenText,
  ChevronRight,
  Flame,
  Heart,
  MapPinned,
  MessageCircleMore,
  Settings,
  Sparkles,
  Volume2,
} from "lucide-react";
import { IslandCard } from "@/components/island-card";
import { ISLANDS, islandProgress, islandStatus } from "@/data/islands";
import { ttsSpeak } from "@/lib/api";
import { useTelegram } from "@/providers/telegram-provider";
import { useAuth } from "@/providers/auth-provider";
import { levelOf, MAX_HEARTS, useProgress } from "@/store/use-progress";

export default function Home() {
  const reduceMotion = useReducedMotion();
  const completedLessons = useProgress((s) => s.completedLessons);
  const xp = useProgress((s) => s.xp);
  const streak = useProgress((s) => s.streak);
  const hearts = useProgress((s) => s.hearts);
  const { user: tgUser } = useTelegram();
  const { user: authUser } = useAuth();
  const displayName = authUser?.display_name ?? tgUser?.first_name ?? "Айгуль";
  const { level, title: levelTitle, into } = levelOf(xp);

  const wordOfDay = useMemo(() => {
    const words: { tt: string; ru: string; island: string }[] = [];
    for (const island of ISLANDS) {
      for (const lesson of island.lessons) {
        for (const word of lesson.words) {
          words.push({ tt: word.tt, ru: word.ru, island: island.title });
        }
      }
    }
    const day = Math.floor(Date.now() / 86400000);
    return words[day % words.length];
  }, []);

  const doneIslands = ISLANDS.filter(
    (_, index) => islandStatus(index, completedLessons) === "done",
  ).length;

  return (
    <main className="relative flex w-full flex-1 flex-col pb-8">
      <div className="map-noise absolute inset-0 pointer-events-none" aria-hidden />

      <header className="relative z-[1] px-4 pt-4">
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="avatar-seal flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-black"
            aria-label="Открыть профиль"
          >
            {displayName.slice(0, 1)}
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">Исәнме, {displayName}!</p>
            <p className="text-xs text-[var(--muted)]">
              {level} дәрәҗә · {levelTitle}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="status-pill" title="Серия дней">
              <Flame className="size-3.5 text-[var(--terracotta)]" aria-hidden />
              {streak}
            </span>
            <span className="status-pill" title={`Сердца: ${hearts} из ${MAX_HEARTS}`}>
              <Heart className="size-3.5 fill-[var(--terracotta)] text-[var(--terracotta)]" aria-hidden />
              {hearts}
            </span>
            <Link
              href="/profile"
              className="flex size-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
              aria-label="Настройки"
            >
              <Settings className="size-4" aria-hidden />
            </Link>
          </div>
        </div>

        <section className="hero-folio mt-5 overflow-hidden rounded-[2rem] border border-[var(--line)] p-5">
          <div className="relative z-[1]">
            <p className="text-[10px] font-black tracking-[0.2em] text-[var(--accent)] uppercase">
              Татар архипелагы
            </p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div>
                <h1 className="max-w-[14rem] text-[2rem] leading-[0.98] font-black tracking-[-0.045em] text-balance">
                  Слова живут на островах
                </h1>
                <p className="mt-3 max-w-[15rem] text-sm leading-5 text-[var(--muted)]">
                  Плыви по темам, знакомься с хранителями и собирай свою речь.
                </p>
              </div>
              <motion.div
                animate={reduceMotion ? undefined : { y: [0, -5, 0], rotate: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: 5 }}
                className="relative flex size-24 shrink-0 items-center justify-center"
                aria-hidden
              >
                <span className="absolute inset-0 rounded-[45%] bg-[var(--water)]/35 blur-xl" />
                <span className="text-[4.5rem] drop-shadow-[0_12px_18px_rgba(32,60,54,0.25)]">⛵</span>
              </motion.div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span>{doneIslands} из {ISLANDS.length} островов</span>
                  <span className="font-bold text-[var(--accent)] tabular-nums">{xp} XP</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--track)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${Math.max(4, (doneIslands / ISLANDS.length) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="grid size-12 shrink-0 place-items-center rounded-full border border-[var(--gold)]/40 bg-[var(--gold-soft)] text-xs font-black text-[var(--gold)]">
                {into}%
              </div>
            </div>
          </div>
          <div className="hero-ornament absolute inset-y-0 right-0 w-40 opacity-35" aria-hidden />
        </section>
      </header>

      <section className="relative z-[1] mt-4 px-4">
        <div className="grid grid-cols-[1fr_auto] gap-3 rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] p-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.16em] text-[var(--terracotta)] uppercase">
              Бүгенге сүз · слово дня
            </p>
            <p className="mt-1 text-xl font-black">{wordOfDay.tt}</p>
            <p className="text-sm text-[var(--muted)]">
              {wordOfDay.ru} · {wordOfDay.island}
            </p>
          </div>
          <button
            onClick={() => void ttsSpeak(wordOfDay.tt)}
            className="flex size-12 items-center justify-center self-center rounded-full bg-[var(--accent)] text-white shadow-[0_6px_0_var(--accent-deep)] active:translate-y-1 active:shadow-none"
            aria-label={`Озвучить ${wordOfDay.tt}`}
          >
            <Volume2 className="size-5" aria-hidden />
          </button>
        </div>
      </section>

      <section className="relative z-[1] mt-6 px-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.18em] text-[var(--muted)] uppercase">
              <MapPinned className="size-3.5 text-[var(--accent)]" aria-hidden />
              Маршрут
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.03em]">
              Острова Татарстана
            </h2>
          </div>
          <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[11px] text-[var(--muted)]">
            10 тем
          </span>
        </div>

        <div className="island-route relative mt-5 flex flex-col gap-5 pb-4">
          {ISLANDS.map((island, index) => {
            const status = islandStatus(index, completedLessons);
            const progress = islandProgress(island, completedLessons);
            const node = (
              <IslandCard
                island={island}
                status={status}
                done={progress.done}
                total={progress.total}
                pct={progress.pct}
                index={index}
              />
            );

            return status === "locked" ? (
              <div key={island.slug}>{node}</div>
            ) : (
              <Link key={island.slug} href={`/island/${island.slug}`}>
                {node}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="relative z-[1] mt-3 px-4">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/progress" className="portal-link portal-link--warm">
            <Sparkles className="size-5" aria-hidden />
            <span>
              <span className="block font-bold">Мәдәният</span>
              <span className="block text-xs opacity-65">Культура и традиции</span>
            </span>
            <ChevronRight className="ml-auto size-4" aria-hidden />
          </Link>
          <Link href="/dictionary" className="portal-link">
            <BookOpenText className="size-5" aria-hidden />
            <span>
              <span className="block font-bold">Сүзлек</span>
              <span className="block text-xs opacity-65">Личный словарь</span>
            </span>
            <ChevronRight className="ml-auto size-4" aria-hidden />
          </Link>
        </div>

        <Link href="/assistant" className="mt-3 flex items-center gap-3 rounded-[1.5rem] bg-[var(--ink)] p-4 text-[var(--paper)]">
          <span className="flex size-11 items-center justify-center rounded-full bg-white/10">
            <MessageCircleMore className="size-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-bold">Поговорить с Ярдәмче</span>
            <span className="block text-xs text-white/60">Татарча сөйләшеп карыйк</span>
          </span>
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </section>
    </main>
  );
}

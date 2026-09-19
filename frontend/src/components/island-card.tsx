"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronRight,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import type { Island, IslandStatus } from "@/data/islands";
import { cn } from "@/lib/utils";

const ISLAND_SCENES: Record<
  Island["icon"],
  { emoji: string; detail: string; tint: string }
> = {
  wave: {
    emoji: "🕌",
    detail: "башня Сөембикә",
    tint: "from-[#cfaa57]/28 via-[#f4e7c8]/10 to-transparent",
  },
  apple: {
    emoji: "🥘",
    detail: "чәй табыны",
    tint: "from-[#bd6b4d]/25 via-[#f2d3b7]/10 to-transparent",
  },
  hash: {
    emoji: "🔢",
    detail: "бердән унга",
    tint: "from-[#507c70]/25 via-[#b9d5cb]/10 to-transparent",
  },
  home: {
    emoji: "🏡",
    detail: "гаилә йорты",
    tint: "from-[#b88945]/24 via-[#ead3a7]/10 to-transparent",
  },
  paw: {
    emoji: "🐺",
    detail: "урман дуслары",
    tint: "from-[#536c58]/28 via-[#b8c9b7]/10 to-transparent",
  },
  building: {
    emoji: "🏛️",
    detail: "Казан урамнары",
    tint: "from-[#65748a]/25 via-[#c4cedc]/10 to-transparent",
  },
  tree: {
    emoji: "🌿",
    detail: "Идел буенда",
    tint: "from-[#4f7866]/28 via-[#a7c8b9]/10 to-transparent",
  },
  compass: {
    emoji: "⛵",
    detail: "ерак юллар",
    tint: "from-[#436f79]/28 via-[#a9cad0]/10 to-transparent",
  },
  palette: {
    emoji: "🧵",
    detail: "милли бизәкләр",
    tint: "from-[#9b5b55]/24 via-[#dcb8b2]/10 to-transparent",
  },
  clock: {
    emoji: "🌙",
    detail: "көн һәм төн",
    tint: "from-[#485d72]/28 via-[#a9b8c7]/10 to-transparent",
  },
};

interface IslandCardProps {
  island: Island;
  status: IslandStatus;
  done: number;
  total: number;
  pct: number;
  index?: number;
}

export function IslandCard({
  island,
  status,
  done,
  total,
  pct,
  index = 0,
}: IslandCardProps) {
  const reduceMotion = useReducedMotion();
  const scene = ISLAND_SCENES[island.icon];
  const locked = status === "locked";
  const mirrored = index % 2 === 1;

  return (
    <motion.article
      initial={reduceMotion ? false : { y: 14, rotate: mirrored ? 1 : -1 }}
      animate={{ y: 0, rotate: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.3), duration: 0.34 }}
      className={cn(
        "island-node group relative min-h-48 overflow-hidden rounded-[2.25rem] border p-4",
        mirrored ? "ml-7" : "mr-7",
        status === "done" && "island-node--done",
        status === "open" && "island-node--open",
        locked && "island-node--locked",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-90",
          scene.tint,
        )}
        aria-hidden
      />
      <div className="ornament-corner absolute -top-4 -right-4 size-24 opacity-25" aria-hidden />

      <div className="relative z-[1] flex min-h-40 flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-[var(--muted)] uppercase">
              Остров {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.02em]">
              {island.title}
            </h2>
            <p className="mt-0.5 text-sm font-medium text-[var(--accent)]">
              {island.titleRu}
            </p>
          </div>

          <motion.div
            animate={
              reduceMotion || locked
                ? undefined
                : { y: [0, -6, 0], rotate: [0, 2, -2, 0] }
            }
            transition={{ repeat: Infinity, duration: 4.8 + index * 0.15 }}
            className="island-emblem flex size-[4.5rem] shrink-0 items-center justify-center rounded-[1.65rem] text-[2.55rem]"
            role="img"
            aria-label={scene.detail}
          >
            {scene.emoji}
          </motion.div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-[var(--muted)]">
              {island.guide} · {scene.detail}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--track)]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    status === "done" ? "bg-[var(--gold)]" : "bg-[var(--accent)]",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-[var(--muted)] tabular-nums">
                {done}/{total}
              </span>
            </div>
          </div>

          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full border",
              status === "done" && "border-[var(--gold)]/50 bg-[var(--gold-soft)] text-[var(--gold)]",
              status === "open" && "border-[var(--accent)]/50 bg-[var(--accent-soft)] text-[var(--accent)]",
              locked && "border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)]",
            )}
          >
            {status === "done" ? (
              <Check className="size-4" aria-label="Пройден" />
            ) : status === "open" ? (
              <ChevronRight className="size-4" aria-label="Открыт" />
            ) : (
              <LockKeyhole className="size-4" aria-label="Закрыт" />
            )}
          </span>
        </div>
      </div>

      {status === "open" && (
        <Sparkles className="absolute right-5 bottom-16 size-4 text-[var(--gold)] opacity-60" aria-hidden />
      )}
    </motion.article>
  );
}

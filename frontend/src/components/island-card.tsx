"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Island, IslandStatus } from "@/data/islands";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const EMOJI: Record<Island["icon"], string> = {
  wave: "🏠",
  apple: "🍲",
  hash: "🔢",
  home: "👪",
  paw: "🐺",
  building: "🏙️",
  tree: "🌲",
  compass: "🧳",
  palette: "🎨",
  clock: "🕐",
};

const STATUS_META: Record<IslandStatus, { emoji: string; label: string }> = {
  done: { emoji: "✅", label: "Пройден" },
  open: { emoji: "🔓", label: "Доступен" },
  locked: { emoji: "🔒", label: "Закрыт" },
};

interface IslandCardProps {
  island: Island;
  status: IslandStatus;
  done: number;
  total: number;
  pct: number;
  /** Порядковый номер для stagger-анимации появления. */
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
  const meta = STATUS_META[status];
  const locked = status === "locked";

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.5), duration: 0.35 }}
      className="h-full"
    >
      <Card
        className={cn(
          "h-full overflow-hidden",
          status === "done" && "glow-gold",
          status === "open" && "glow-green",
          locked && "opacity-60",
        )}
      >
        {/* Арт острова с покачиванием */}
        <div className="flex h-28 items-center justify-center bg-gradient-to-b from-[#34d399]/20 via-[#0d3a2b] to-[#04150f]">
          <div
            className={reduceMotion ? undefined : "float-slow"}
            style={{ animationDelay: `${(index % 6) * 0.7}s` }}
          >
          <motion.span
            role="img"
            aria-label={`Остров ${island.title}`}
            className="inline-block text-5xl"
            animate={reduceMotion ? undefined : { rotate: [0, 2.5, -2.5, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          >
            {EMOJI[island.icon]}
          </motion.span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          <h2 className="font-semibold">{island.title}</h2>
          <p className="text-xs text-[#9db8a8]">{island.guide}</p>

          <Badge
            variant={status}
            className="mt-1 w-fit"
            aria-label={`Статус: ${meta.label}`}
          >
            <span aria-hidden>{meta.emoji}</span>
            {meta.label}
          </Badge>

          <div className="mt-auto flex items-center gap-2 pt-2">
            <Progress value={done} max={total} className="h-1.5 flex-1" />
            <span className="text-[11px] text-[#9db8a8] tabular-nums">
              {pct}%
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

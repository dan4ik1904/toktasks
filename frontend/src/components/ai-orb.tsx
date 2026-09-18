"use client";

import { motion, useReducedMotion } from "framer-motion";
import { IslandIcon } from "@/components/island-icon";
import type { Island } from "@/data/islands";
import { cn } from "@/lib/utils";

interface AIOrbProps {
  icon: Island["icon"];
  /** Имя духа-хранителя под орбом. */
  guide?: string;
  /** Активен (слушает/говорит) — усиленное свечение и эквалайзер. */
  active?: boolean;
  className?: string;
}

function EqBars({ side }: { side: "left" | "right" }) {
  const bars = [14, 26, 38, 26, 14];
  return (
    <div
      className={cn("flex items-center gap-1", side === "left" && "flex-row-reverse")}
      aria-hidden
    >
      {bars.map((h, i) => (
        <span
          key={i}
          className="eq-bar w-1.5 rounded-full bg-gradient-to-t from-[#58cc02] to-[#ffc800]"
          style={{ height: h, animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

/** Круглый ИИ-дух с золотым кольцом и эквалайзером по бокам. */
export function AIOrb({ icon, guide, active = false, className }: AIOrbProps) {
  const reduceMotion = useReducedMotion();
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="flex items-center justify-center gap-4">
        <EqBars side="left" />
        <motion.div
          className="spirit-ring rounded-full p-1.5"
          animate={
            active && !reduceMotion
              ? { scale: [1, 1.05, 1] }
              : { scale: 1 }
          }
          transition={
            active ? { repeat: Infinity, duration: 1.6, ease: "easeInOut" } : undefined
          }
        >
          <div className="flex size-36 items-center justify-center rounded-full bg-[#171239]">
            <IslandIcon icon={icon} className="size-16 text-[#ffc800]" />
          </div>
        </motion.div>
        <EqBars side="right" />
      </div>
      {guide && (
        <p className="text-xs text-[#a7a2c9]">{guide} · хранитель острова</p>
      )}
    </div>
  );
}

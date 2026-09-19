"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskNumbersProps {
  total: number;
  current: number;
  /** Индексы выполненных заданий. */
  done: boolean[];
  /** Самый дальний открытый шаг (клик разрешён до него включительно). */
  maxReached: number;
  onSelect: (index: number) => void;
}

/**
 * Номера заданий: круглые бейджи с горизонтальным скроллом.
 * Пройденный — золотой ✅, текущий — изумрудный с пульсацией, будущий — серый.
 */
export function TaskNumbers({
  total,
  current,
  done,
  maxReached,
  onSelect,
}: TaskNumbersProps) {
  return (
    <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ol
        className="flex min-w-full items-center justify-start gap-2 px-4"
        aria-label="Задания урока"
      >
        {Array.from({ length: total }, (_, i) => {
          const isDone = done[i];
          const isCurrent = i === current;
          const clickable = i <= maxReached;
          return (
            <li key={i} className="shrink-0">
              <motion.button
                type="button"
                disabled={!clickable}
                onClick={() => onSelect(i)}
                aria-label={`Задание ${i + 1}${isDone ? ", выполнено" : isCurrent ? ", текущее" : ""}`}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full border text-sm font-semibold transition-transform",
                  isDone
                    ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--ink)]"
                    : isCurrent
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-[var(--line)] text-[var(--muted)]",
                  clickable ? "cursor-pointer" : "cursor-default opacity-70",
                )}
                animate={
                  isCurrent
                    ? { boxShadow: ["0 0 0px rgba(23,107,91,0.55)", "0 0 18px rgba(23,107,91,0.55)", "0 0 0px rgba(23,107,91,0.55)"] }
                    : { boxShadow: "0 0 0px rgba(0,0,0,0)" }
                }
                transition={
                  isCurrent
                    ? { repeat: Infinity, duration: 1.8, ease: "easeInOut" }
                    : undefined
                }
              >
                {isDone ? <Check className="size-4" aria-hidden /> : i + 1}
              </motion.button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

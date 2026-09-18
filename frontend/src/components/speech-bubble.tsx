"use client";

import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { ttsSpeak } from "@/lib/api";
import { cn } from "@/lib/utils";

export interface Speech {
  tt: string;
  ru: string;
}

/**
 * Титры духа-хранителя: что говорит ИИ, крупно по-татарски + перевод.
 * Тап по динамику повторяет реплику.
 */
export function SpeechBubble({
  speech,
  voice = "alsu",
  needsTap = false,
}: {
  speech: Speech;
  voice?: string;
  needsTap?: boolean;
}) {
  return (
    <motion.section
      key={speech.tt}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      aria-live="polite"
      className="rounded-2xl border border-[#ffc800]/35 bg-[#1d1747]/80 p-4"
    >
      <p className="pb-1 text-[11px] tracking-widest text-[#ffc800] uppercase">
        {needsTap ? "Нажми 🔊 — хранитель говорит" : "Хранитель говорит"}
      </p>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-lg font-semibold text-balance">{speech.tt}</p>
          <p className="pt-1 text-sm text-[#a7a2c9]">{speech.ru}</p>
        </div>
        <button
          onClick={() => void ttsSpeak(speech.tt, voice)}
          aria-label="Прослушать реплику"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full bg-[#ffc800]/15 text-[#ffc800] hover:bg-[#ffc800]/25",
            needsTap && "animate-pulse",
          )}
        >
          <Volume2 className="size-5" aria-hidden />
        </button>
      </div>
    </motion.section>
  );
}

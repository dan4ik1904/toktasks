"use client";

import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  variant: "mic" | "translate" | "help";
  onClick: () => void;
  disabled?: boolean;
  listening?: boolean;
  label?: string;
}

const META = {
  mic: { emoji: "🎤", defaultLabel: "Произнести" },
  translate: { emoji: "🇷🇺", defaultLabel: "Перевод" },
  help: { emoji: "❓", defaultLabel: "Не понимаю" },
} as const;

/** Кнопки голосового задания: большая 🎤 и две малые. */
export function VoiceButton({
  variant,
  onClick,
  disabled = false,
  listening = false,
  label,
}: VoiceButtonProps) {
  const meta = META[variant];

  if (variant === "mic") {
    return (
      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        whileTap={{ scale: 0.97 }}
        animate={listening ? { scale: [1, 1.03, 1] } : { scale: 1 }}
        transition={listening ? { repeat: Infinity, duration: 1 } : undefined}
        className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#7c5cff] font-semibold text-white shadow-[0_0_24px_rgba(124,92,255,0.45)] disabled:opacity-60"
      >
        {listening ? (
          <Mic className="size-5 animate-pulse" aria-hidden />
        ) : (
          <span aria-hidden>{meta.emoji}</span>
        )}
        {listening ? "Слушаю…" : (label ?? meta.defaultLabel)}
      </motion.button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-14 w-20 flex-col items-center justify-center gap-0.5 rounded-2xl border border-[#3a3370] bg-[#1d1747]/80 text-xs disabled:opacity-50",
      )}
    >
      <span className="text-lg" aria-hidden>
        {meta.emoji}
      </span>
      {label ?? meta.defaultLabel}
    </button>
  );
}

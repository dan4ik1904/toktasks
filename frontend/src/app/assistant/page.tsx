"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Send } from "lucide-react";
import { apiConfigured, assistantChatApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const STARTERS = [
  "Как сказать «спасибо» по-татарски?",
  "Объясни разницу исәнме и исәнмесез",
  "Составь 3 фразы для знакомства",
  "Что значит «рәхмәт»?",
];

const OFFLINE: [string, string][] = [
  ["спасибо", "«Рәхмәт!» — менә шулай рәхмәт әйтәләр. (Вот так говорят «спасибо». Вежливо: «Зур рәхмәт!».)"],
  ["рәхмәт", "«Рәхим ит!» — шулай җавап бирәләр. (Так отвечают на благодарность.)"],
  ["привет", "«Сәлам!» — дустыңа. «Исәнмесез!» — өлкәннәргә. (Другу — сәлам, старшим — исәнмесез.)"],
  ["исәнме", "«Исәнме!» — дустыңа, «исәнмесез!» — өлкәннәргә. («Здоров ли ты?» — другу и вежливо.)"],
  ["знакомств", "«Минем исемем …» — «Синең исемең ничек?» — «Шатмын!» (Меня зовут … — А тебя как? — Рад знакомству!)"],
  ["фраз", "«Минем исемем …!» — «Син кайдан?» — «Шатмын!» (Три фразы для знакомства. Повтори их на острове Сәлам.)"],
];

function localReply(question: string): string {
  const low = question.toLowerCase();
  for (const [key, answer] of OFFLINE) {
    if (low.includes(key)) return answer;
  }
  return "«Әйт әле тагын!» — аңламадым. (Скажи ещё раз — не понял. Спроси, мәсәлән, «как сказать спасибо».)";
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "«Исәнме! Мин Ярдәмче!» — сора! (Привет! Я Ярдәмче — спрашивай!)",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const online = apiConfigured();

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setLoading(true);
    try {
      const reply = online
        ? await assistantChatApi(question)
        : localReply(question);
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: localReply(question) }]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      );
    }
  }

  return (
    <main className="flex w-full flex-1 flex-col gap-4 px-4 pt-4 pb-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Назад к островам"
          className="flex size-10 items-center justify-center rounded-full hover:bg-white/5"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#7c5cff] text-white">
          <Bot className="size-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-bold">Ярдәмче</h1>
          <p className="text-xs text-[#a7a2c9]">
            {online ? "онлайн · Tatsoft + LLM" : "офлайн-режим · без сервера"}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
              m.role === "user"
                ? "self-end bg-[#7c5cff] text-white"
                : "self-start border border-[#3a3370] bg-[#1d1747]/80",
            )}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="max-w-[85%] self-start rounded-2xl border border-[#3a3370] bg-[#1d1747]/80 px-4 py-3 text-sm text-[#a7a2c9]">
            Ярдәмче яза…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-2">
        {STARTERS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-full border border-[#3a3370] px-3 py-1.5 text-xs text-[#a7a2c9] hover:bg-white/5"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Спроси по-татарски или по-русски…"
          className="h-11 flex-1 rounded-xl border border-[#3a3370] bg-[#1d1747]/80 px-4 text-sm outline-none placeholder:text-[#a7a2c9] focus:border-[#58cc02]"
        />
        <button
          type="submit"
          aria-label="Отправить"
          disabled={loading}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7c5cff] text-white disabled:opacity-50"
        >
          <Send className="size-4" aria-hidden />
        </button>
      </form>
    </main>
  );
}

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Send } from "lucide-react";
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
  ["спасибо", "«Спасибо» — рәхмәт (рәх-мәт). Вежливо: зур рәхмәт — большое спасибо."],
  ["рәхмәт", "Әйе! Рәхмәт — «спасибо». Ответ: рәхим ит — «пожалуйста» в ответ на благодарность."],
  ["привет", "«Привет» — сәлам! Другу: исәнме! Вежливо: исәнмесез!"],
  ["исәнме", "Исәнме — другу, исәнмесез — вежливо или старшим. Буквально: «здоров ли ты?»"],
  ["знакомств", "«Меня зовут …» — минем исемем … А спросить: синең исемең ничек? И в ответ: шатмын!"],
  ["фраз", "Три фразы для знакомства: минем исемем … / син кайдан? / шатмын! Скажи их вслух на острове Сәлам."],
];

function localReply(question: string): string {
  const low = question.toLowerCase();
  for (const [key, answer] of OFFLINE) {
    if (low.includes(key)) return answer;
  }
  return "Ярдәмче пока без сервера: я знаю базовые фразы про приветствия и знакомство. Спроси, например, «как сказать спасибо».";
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Исәнме! Мин Ярдәмче — твой помощник в татарском. Спроси перевод или объяснение.",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  function send(text: string) {
    const question = text.trim();
    if (!question) return;
    setInput("");
    setMessages((m) => [
      ...m,
      { role: "user", text: question },
      { role: "assistant", text: localReply(question) },
    ]);
    requestAnimationFrame(() =>
      bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
    );
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
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#0e9f6e] text-white">
          <Bot className="size-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-xl font-bold">Ярдәмче</h1>
          <p className="text-xs text-[#9db8a8]">офлайн-режим · без сервера</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
              m.role === "user"
                ? "self-end bg-[#0e9f6e] text-white"
                : "self-start border border-[#1c4d3a] bg-[#0a2e23]/80",
            )}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-2">
        {STARTERS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-full border border-[#1c4d3a] px-3 py-1.5 text-xs text-[#9db8a8] hover:bg-white/5"
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
          className="h-11 flex-1 rounded-xl border border-[#1c4d3a] bg-[#0a2e23]/80 px-4 text-sm outline-none placeholder:text-[#9db8a8] focus:border-[#34d399]"
        />
        <button
          type="submit"
          aria-label="Отправить"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0e9f6e] text-white"
        >
          <Send className="size-4" aria-hidden />
        </button>
      </form>
    </main>
  );
}

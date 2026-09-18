"use client";

import { useRef, useState } from "react";
import { Bot, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const STARTERS = [
  "Как сказать «спасибо» по-татарски?",
  "Объясни разницу исәнме и исәнмесез",
  "Составь 3 фразы для знакомства",
  "Проверь меня: спроси 5 слов из острова Саннар",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Исәнме! Мин Ярдәмче — твой помощник в татарском. Спроси перевод, объяснение или попроси проверить тебя.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/assistant/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { reply: string };
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Бэкенд недоступен. Проверь, что FastAPI запущен (см. README), и попробуй ещё раз.",
        },
      ]);
    } finally {
      setLoading(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
      <section className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
          <Bot className="size-6" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Ярдәмче</h1>
          <p className="text-sm opacity-70">
            ИИ-помощник: переводы, объяснения, мини-тесты
          </p>
        </div>
      </section>

      <div className="flex flex-1 flex-col gap-3">
        {messages.map((m, i) => (
          <Card
            key={i}
            className={cn(
              "max-w-[85%]",
              m.role === "user"
                ? "self-end bg-emerald-600 text-white dark:bg-emerald-600"
                : "self-start",
            )}
          >
            <CardContent className="px-4 py-3 text-sm whitespace-pre-wrap">
              {m.text}
            </CardContent>
          </Card>
        ))}
        {loading && (
          <Card className="max-w-[85%] self-start">
            <CardContent className="px-4 py-3 text-sm opacity-60">
              Ярдәмче яза…
            </CardContent>
          </Card>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-2">
        {STARTERS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-full border border-black/10 px-3 py-1.5 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
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
          className="h-11 flex-1 rounded-xl border border-black/10 bg-transparent px-4 text-sm outline-none focus:border-emerald-600 dark:border-white/15"
        />
        <Button type="submit" size="icon" className="h-11 w-11" disabled={loading}>
          <Send aria-label="Отправить" />
        </Button>
      </form>
    </main>
  );
}

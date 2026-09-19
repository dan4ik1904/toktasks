"use client";

import { useMemo, useState } from "react";
import { Search, Volume2 } from "lucide-react";
import { ISLANDS } from "@/data/islands";
import { ttsSpeak } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function DictionaryPage() {
  const [query, setQuery] = useState("");
  const [island, setIsland] = useState<string>("all");

  const rows = useMemo(() => {
    const all: { tt: string; ru: string; island: string; slug: string }[] = [];
    for (const isl of ISLANDS) {
      for (const l of isl.lessons) {
        for (const w of l.words) {
          all.push({ tt: w.tt, ru: w.ru, island: isl.title, slug: isl.slug });
        }
      }
    }
    const q = query.trim().toLowerCase();
    return all.filter(
      (r) =>
        (island === "all" || r.slug === island) &&
        (!q || r.tt.toLowerCase().includes(q) || r.ru.toLowerCase().includes(q)),
    );
  }, [query, island]);

  return (
    <main className="flex w-full flex-1 flex-col gap-3 px-4 pt-4 pb-6">
      <h1 className="text-2xl font-bold">Словарь</h1>

      <label className="flex h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3">
        <Search className="size-4 shrink-0 text-[var(--muted)]" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти слово…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
        />
      </label>

      <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setIsland("all")}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs",
            island === "all"
              ? "bg-[var(--gold)] font-bold text-[var(--ink)]"
              : "border border-[var(--line)]",
          )}
        >
          Все
        </button>
        {ISLANDS.map((i) => (
          <button
            key={i.slug}
            onClick={() => setIsland(i.slug)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs",
              island === i.slug
                ? "bg-[var(--gold)] font-bold text-[var(--ink)]"
                : "border border-[var(--line)]",
            )}
          >
            {i.title}
          </button>
        ))}
      </div>

      <p className="text-xs text-[var(--muted)] tabular-nums">Слов: {rows.length}</p>

      <ul className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <li
            key={`${r.slug}-${r.tt}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5"
          >
            <div>
              <p className="font-semibold">{r.tt}</p>
              <p className="text-xs text-[var(--muted)]">
                {r.ru} · {r.island}
              </p>
            </div>
            <button
              onClick={() => void ttsSpeak(r.tt)}
              aria-label={`Озвучить: ${r.tt}`}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)] hover:brightness-95"
            >
              <Volume2 className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

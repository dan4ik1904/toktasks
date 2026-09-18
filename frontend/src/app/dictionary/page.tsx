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

      <label className="flex h-11 items-center gap-2 rounded-xl border border-[#3a3370] bg-[#1d1747]/80 px-3">
        <Search className="size-4 shrink-0 text-[#a7a2c9]" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти слово…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#a7a2c9]"
        />
      </label>

      <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setIsland("all")}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs",
            island === "all" ? "bg-[#ffc800] font-bold text-[#120e2b]" : "border border-[#3a3370]",
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
              island === i.slug ? "bg-[#ffc800] font-bold text-[#120e2b]" : "border border-[#3a3370]",
            )}
          >
            {i.title}
          </button>
        ))}
      </div>

      <p className="text-xs text-[#a7a2c9] tabular-nums">Слов: {rows.length}</p>

      <ul className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <li
            key={`${r.slug}-${r.tt}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-[#3a3370] bg-[#1d1747]/80 px-3 py-2.5"
          >
            <div>
              <p className="font-semibold">{r.tt}</p>
              <p className="text-xs text-[#a7a2c9]">
                {r.ru} · {r.island}
              </p>
            </div>
            <button
              onClick={() => void ttsSpeak(r.tt)}
              aria-label={`Озвучить: ${r.tt}`}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#58cc02] hover:bg-white/10"
            >
              <Volume2 className="size-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

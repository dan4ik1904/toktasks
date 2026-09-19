"use client";

import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { leaderboardApi, type LeaderRow } from "@/lib/api";
import { useProgress } from "@/store/use-progress";
import { cn } from "@/lib/utils";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function TopPage() {
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const tgId = useProgress((s) => s.tgId) || "demo";

  useEffect(() => {
    void leaderboardApi().then(setRows);
  }, []);

  return (
    <main className="flex w-full flex-1 flex-col gap-4 px-4 pt-4 pb-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Crown className="size-6 text-[var(--gold)]" aria-hidden />
        Топ учеников
      </h1>

      {rows === null ? (
        <p className="text-sm text-[var(--muted)]">Загружаю топ…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          Сервер недоступен или топ пуст. Проходи уроки — и будешь первым!
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {rows.map((r, i) => {
            const mine = r.tg_id === tgId;
            return (
              <li
                key={r.tg_id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3",
                  mine
                    ? "border-[var(--gold)]/60 bg-[var(--gold-soft)]"
                    : "border-[var(--line)] bg-[var(--surface)]",
                )}
              >
                <span className="w-8 shrink-0 text-center text-xl" aria-hidden>
                  {MEDALS[i] ?? `${i + 1}`}
                </span>
                <span className="avatar-seal flex size-10 shrink-0 items-center justify-center rounded-full font-bold">
                  {r.name.slice(0, 1)}
                </span>
                <div className="flex-1">
                  <p className="font-semibold">
                    {r.name}
                    {mine && <span className="text-xs text-[var(--gold)]"> · ты</span>}
                  </p>
                  <p className="text-xs text-[var(--muted)] tabular-nums">
                    {r.lessons} уроков · 🔥 {r.streak}
                  </p>
                </div>
                <span className="text-sm font-bold text-[var(--gold)] tabular-nums">
                  {r.xp} XP
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}

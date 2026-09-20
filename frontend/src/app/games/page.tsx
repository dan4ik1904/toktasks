"use client";

import { useState, useCallback } from "react";
import { Trophy } from "lucide-react";
import { useStore } from "@/store/use-store";
import { RunnerGame } from "@/components/games/RunnerGame";
import { EchpochmakGame } from "@/components/games/EchpochmakGame";
import { QuizGame } from "@/components/games/QuizGame";

type GameTab = "runner" | "catcher" | "quiz";

const TABS: { id: GameTab; label: string; desc: string }[] = [
  { id: "runner", label: "👹 Шурале", desc: "Беги джигитом от лесного духа Шурале, перепрыгивай преграды." },
  { id: "catcher", label: "🥟 Эчпочмак", desc: "Лови падающие традиционные блюда и уклоняйся от мухоморов." },
  { id: "quiz", label: "📚 Квиз", desc: "Проверка словарного запаса по уровням." },
];

export default function GamesPage() {
  const { addPoints, registerGame } = useStore();
  const [tab, setTab] = useState<GameTab>("runner");
  const [toast, setToast] = useState<string | null>(null);

  const handleDone = useCallback((basePts: number) => {
    // Обесцениваем награду в 3-4 раза, чтобы денег давалось меньше
    const nerfedPts = Math.max(1, Math.round(basePts / 3.5));
    if (nerfedPts > 0) {
      addPoints(nerfedPts);
      setToast(`+${nerfedPts} XP (баланс наград снижен)!`);
      setTimeout(() => setToast(null), 2500);
    }
    registerGame();
  }, [addPoints, registerGame]);

  return (
    <div className="page-shell">
      <div>
        <h1 className="page-title">Мини-игры</h1>
        <p className="page-subtitle">Практика слов в игровом формате</p>
      </div>

      <div className="seg" role="tablist" aria-label="Выбор игры">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "active runner" : ""}
            onClick={() => setTab(t.id)}
            style={{ fontSize: "0.75rem", padding: "0.6rem 0.3rem" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "runner" ? (
        <RunnerGame onDone={handleDone} />
      ) : tab === "catcher" ? (
        <EchpochmakGame onDone={handleDone} />
      ) : (
        <QuizGame onDone={handleDone} />
      )}

      {toast && (
        <div className="toast-float animate-pop">
          <Trophy size={14} style={{ flexShrink: 0 }} /> <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

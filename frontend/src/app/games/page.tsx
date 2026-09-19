"use client";

import { useState, useCallback } from "react";
import { Gamepad2, Trophy } from "lucide-react";
import { useStore } from "@/store/use-store";
import { RunnerGame } from "@/components/games/RunnerGame";
import { EchpochmakGame } from "@/components/games/EchpochmakGame";
import { QuizGame } from "@/components/games/QuizGame";

type GameTab = "runner" | "catcher" | "quiz";

const TABS: { id: GameTab; label: string; desc: string }[] = [
  { id: "runner", label: "👹 Шурале-раннер", desc: "Беги джигитом от лесного духа Шурале, перепрыгивай преграды." },
  { id: "catcher", label: "🥟 Өчпочмак җыю", desc: "Лови падающие традиционные блюда и уклоняйся от мухоморов." },
  { id: "quiz", label: "📚 Словарный квиз", desc: "Проверка словарного запаса по уровням." },
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

  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="page-shell">
      <div>
        <div className="badge badge-red" style={{ marginBottom: 6 }}>
          <Gamepad2 size={11} /> Аркады • Игры
        </div>
        <h1 className="page-title">Мини-игры</h1>
        <p className="page-subtitle">Аркадные мини-игры (награды сбалансированы и уменьшены)</p>
      </div>

      <div className="seg" style={{ gridTemplateColumns: "1fr 1fr 1fr" }} role="tablist" aria-label="Выбор игры">
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

      <div className="card card-red">
        <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>{active.label}</div>
        <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginTop: 2 }}>{active.desc}</div>
      </div>

      {tab === "runner" ? (
        <RunnerGame onDone={handleDone} />
      ) : tab === "catcher" ? (
        <EchpochmakGame onDone={handleDone} />
      ) : (
        <QuizGame onDone={handleDone} />
      )}

      {toast && (
        <div className="animate-pop" style={{
          position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: "var(--gold)", color: "#1a1405", fontWeight: 800, fontSize: "0.85rem",
          padding: "0.6rem 1.1rem", borderRadius: "999px", boxShadow: "var(--glow-gold)", zIndex: 60,
          display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
        }}>
          <Trophy size={14} /> {toast}
        </div>
      )}
    </div>
  );
}

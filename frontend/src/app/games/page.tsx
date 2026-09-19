"use client";

import { useState, useCallback } from "react";
import { Gamepad2, Trophy } from "lucide-react";
import { useStore } from "@/store/use-store";
import { RunnerGame } from "@/components/games/RunnerGame";
import { QuizGame } from "@/components/games/QuizGame";
import { SuzlarGame } from "@/components/games/SuzlarGame";
import { JomlaGame } from "@/components/games/JomlaGame";

// ============================================================
// Вкладка «Игры»: 4 мини-игры для изучения татарского языка.
// ============================================================

type GameTab = "suzlar" | "jomla" | "runner" | "quiz";

const TABS: { id: GameTab; label: string; desc: string }[] = [
  { id: "suzlar", label: "📖 Сүзләр", desc: "Русское слово — выбери перевод на татарский. 10 раундов, +10 за верный." },
  { id: "jomla", label: "📝 Җөмлә", desc: "Собери татарское предложение из слов вразнобой. +15 за верное." },
  { id: "runner", label: "👹 Шурале-раннер", desc: "Беги джигитом от лесных духов, собирай өчпочмаки." },
  { id: "quiz", label: "📚 Словарный вызов", desc: "72 слова трёх уровней, серия умножает очки." },
];

export default function GamesPage() {
  const { addPoints, registerGame } = useStore();
  const [tab, setTab] = useState<GameTab>("suzlar");
  const [toast, setToast] = useState<string | null>(null);

  const handleDone = useCallback((basePts: number) => {
    if (basePts > 0) {
      addPoints(basePts);
      setToast(`+${basePts} баллов начислено!`);
      setTimeout(() => setToast(null), 2500);
    }
    registerGame();
  }, [addPoints, registerGame]);

  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="page-shell">
      {/* Шапка */}
      <div>
        <div className="badge badge-red" style={{ marginBottom: 6 }}>
          <Gamepad2 size={11} /> Уйныйбыз • играем
        </div>
        <h1 className="page-title">Мини-игры</h1>
        <p className="page-subtitle">Практика слов и грамматики в игровом формате</p>
      </div>

      {/* Переключатель игр */}
      <div className="seg seg-4" role="tablist" aria-label="Выбор игры">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? `active ${t.id === "runner" ? "runner" : ""}` : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Описание текущей игры */}
      <div className={tab === "runner" ? "card card-red" : "card card-accent"}>
        <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>{active.label}</div>
        <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginTop: 2 }}>{active.desc}</div>
      </div>

      {tab === "suzlar" ? (
        <SuzlarGame onDone={handleDone} />
      ) : tab === "jomla" ? (
        <JomlaGame onDone={handleDone} />
      ) : tab === "runner" ? (
        <RunnerGame onDone={handleDone} />
      ) : (
        <QuizGame onDone={handleDone} />
      )}

      {/* Тост о баллах */}
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

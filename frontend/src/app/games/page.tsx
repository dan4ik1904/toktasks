"use client";

import { useState, useCallback } from "react";
import { Gamepad2, Trophy, Moon } from "lucide-react";
import { useStore, satietyMultiplier } from "@/store/use-store";
import { RunnerGame } from "@/components/games/RunnerGame";
import { QuizGame } from "@/components/games/QuizGame";
import { SuzlarGame } from "@/components/games/SuzlarGame";
import { JomlaGame } from "@/components/games/JomlaGame";

// ============================================================
// Вкладка «Игры»: 4 мини-игры в едином стиле.
// Сүзләр и Җөмлә — MVP по ТЗ (с помощником-подсказкой),
// раннер и викторина — из прошлого релиза.
// Экономика тамагочи: сытость даёт множитель ×1.5/×1/×0.5,
// каждая игра отнимает 12% сытности; при 0% кот спит.
// ============================================================

type GameTab = "suzlar" | "jomla" | "runner" | "quiz";

const TABS: { id: GameTab; label: string; desc: string }[] = [
  { id: "suzlar", label: "📖 Сүзләр", desc: "Русское слово — выбери перевод на татарский. 10 раундов, +10 за верный." },
  { id: "jomla", label: "📝 Җөмлә", desc: "Собери татарское предложение из слов вразнобой. +15 за верное." },
  { id: "runner", label: "👹 Шурале-раннер", desc: "Беги джигитом от лесных духов, собирай өчпочмаки." },
  { id: "quiz", label: "📚 Словарный вызов", desc: "72 слова трёх уровней, серия умножает очки." },
];

export default function GamesPage() {
  const { addPoints, registerGame, cat } = useStore();
  const [tab, setTab] = useState<GameTab>("suzlar");
  const [toast, setToast] = useState<string | null>(null);

  const mult = satietyMultiplier(cat.hunger);
  const sleeping = cat.hunger <= 0;

  // Начисление из игры: базовые баллы × коэффициент сытности, затем −12% сытности
  const handleDone = useCallback((basePts: number) => {
    const st = useStore.getState();
    const m = satietyMultiplier(st.cat.hunger);
    const pts = Math.round(basePts * m);
    if (pts > 0) {
      st.addPoints(pts);
      setToast(m !== 1 ? `+${pts} баллов (сытость ×${m})!` : `+${pts} баллов начислено!`);
      setTimeout(() => setToast(null), 2500);
    }
    st.registerGame();
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
        <p className="page-subtitle">Сытность {cat.hunger}% → баллы ×{mult}{sleeping ? " • кот спит, покорми его!" : ""}</p>
      </div>

      {/* Переключатель игр 2×2 */}
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

      {/* Кот спит — игры недоступны */}
      {sleeping ? (
        <div className="card card-gold animate-pop" style={{ textAlign: "center", padding: "2rem 1rem" }}>
          <Moon size={36} style={{ color: "var(--gold)" }} />
          <div style={{ fontWeight: 800, marginTop: 8 }}>Кот спит… 😴</div>
          <p style={{ fontSize: "0.8rem", color: "var(--fg-muted)", marginTop: 6 }}>
            Сытность 0% — игры недоступны. Покорми кота в Ашхане!
          </p>
          <a href="/cat" className="btn btn-gold" style={{ marginTop: 12 }}>
            🍲 В Ашхану
          </a>
        </div>
      ) : tab === "suzlar" ? (
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

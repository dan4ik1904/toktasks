"use client";

import { useState, useCallback } from "react";
import { Gamepad2, Trophy } from "lucide-react";
import { useStore } from "@/store/use-store";
import { RunnerGame } from "@/components/games/RunnerGame";
import { QuizGame } from "@/components/games/QuizGame";

// ============================================================
// Вкладка «Игры»: переключатель между двумя мини-играми
// в едином стиле (изумруд / красный / золото + орнамент).
// Очки игр конвертируются в поинты общего стора.
// ============================================================

type GameTab = "runner" | "quiz";

export default function GamesPage() {
  const { addPoints } = useStore();
  const [tab, setTab] = useState<GameTab>("runner");
  const [toast, setToast] = useState<string | null>(null);

  // Начисление поинтов из игры в общий стор + тост
  const handleDone = useCallback((pts: number) => {
    if (pts > 0) {
      addPoints(pts);
      setToast(`+${pts} поинтов начислено!`);
      setTimeout(() => setToast(null), 2500);
    }
  }, [addPoints]);

  return (
    <div className="page-shell">
      {/* Шапка */}
      <div>
        <div className="badge badge-red" style={{ marginBottom: 6 }}>
          <Gamepad2 size={11} /> Уйныйбыз • играем
        </div>
        <h1 className="page-title">Мини-игры</h1>
        <p className="page-subtitle">Шурале-раннер и словарный вызов — рекорды хранятся на устройстве</p>
      </div>

      {/* Переключатель игр */}
      <div className="seg" role="tablist" aria-label="Выбор игры">
        <button
          role="tab"
          aria-selected={tab === "runner"}
          className={tab === "runner" ? "active runner" : ""}
          onClick={() => setTab("runner")}
        >
          👹 Шурале-раннер
        </button>
        <button
          role="tab"
          aria-selected={tab === "quiz"}
          className={tab === "quiz" ? "active" : ""}
          onClick={() => setTab("quiz")}
        >
          📚 Словарный вызов
        </button>
      </div>

      {/* Карточка-описание текущей игры */}
      <div className={tab === "runner" ? "card card-red" : "card card-accent"}>
        {tab === "runner" ? (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div style={{ fontSize: "2rem" }}>👹</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>Шурале-раннер</div>
              <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginTop: 2 }}>
                Беги джигитом от лесных духов, собирай өчпочмаки. Двойной прыжок и приседание включены.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div style={{ fontSize: "2rem" }}>📚</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>Словарный вызов</div>
              <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginTop: 2 }}>
                72 слова трёх уровней. Серия x2/x3/x5 — отвечай точно и быстро.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Сама игра */}
      {tab === "runner" ? <RunnerGame onDone={handleDone} /> : <QuizGame onDone={handleDone} />}

      {/* Тост о поинтах */}
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

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flag, RotateCcw, Lightbulb, Delete } from "lucide-react";
import { SENTENCES } from "@/games/sentences";

// ============================================================
// «Җөмлә» (Предложение) по ТЗ: слова вразнобой — выстрой
// правильный порядок. +15 за верное предложение.
// Подсказка помощника открывает первое слово.
// ============================================================

const POINTS_PER_SENTENCE = 15;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function JomlaGame({ onDone }: { onDone: (basePoints: number) => void }) {
  const [order, setOrder] = useState<number[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [picked, setPicked] = useState<number[]>([]); // индексы из shuffled
  const [checked, setChecked] = useState<null | boolean>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [finished, setFinished] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSentence = useCallback((i: number) => {
    const s = SENTENCES[i % SENTENCES.length]!;
    setShuffled(shuffle(s.tt));
    setPicked([]);
    setChecked(null);
    setHintUsed(false);
  }, []);

  const start = useCallback(() => {
    const indices = shuffle(SENTENCES.map((_, i) => i));
    setOrder(indices);
    setIdx(0);
    setScore(0);
    setFinished(false);
    loadSentence(indices[0]!);
  }, [loadSentence]);

  useEffect(() => {
    start();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [start]);

  const sentence = SENTENCES[order[idx] ?? 0]!;

  const tapWord = (si: number) => {
    if (checked !== null || picked.includes(si)) return;
    setPicked((p) => [...p, si]);
  };

  const undo = () => {
    if (checked !== null) return;
    setPicked((p) => p.slice(0, -1));
  };

  // Подсказка: подставить первое слово правильным
  const askHelper = () => {
    if (checked !== null || hintUsed) return;
    const first = sentence.tt[0]!;
    const si = shuffled.findIndex((w, i) => w === first && !picked.includes(i));
    if (si >= 0) {
      setPicked((p) => [si, ...p.filter((x) => x !== si)]);
      setHintUsed(true);
    }
  };

  const check = () => {
    if (checked !== null || picked.length !== sentence.tt.length) return;
    const built = picked.map((si) => shuffled[si]);
    const ok = built.join(" ") === sentence.tt.join(" ");
    setChecked(ok);
    const gained = ok ? POINTS_PER_SENTENCE : 0;
    if (ok) setScore((s) => s + POINTS_PER_SENTENCE);
    timer.current = setTimeout(() => {
      if (idx + 1 >= order.length) {
        setFinished(true);
        onDone(score + gained);
      } else {
        const ni = idx + 1;
        setIdx(ni);
        loadSentence(order[ni]!);
      }
    }, 1200);
  };

  if (finished) {
    return (
      <div className="card card-gold animate-pop" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2.2rem" }}>📝</div>
        <div style={{ fontWeight: 800, marginTop: 4 }}>Все предложения собраны!</div>
        <div style={{ color: "var(--gold)", fontWeight: 800, fontSize: "1.2rem", marginTop: 4 }}>
          +{score} баллов
        </div>
        <button className="btn btn-gold" onClick={start} style={{ marginTop: 10, width: "100%" }}>
          <RotateCcw size={16} /> Ещё раз
        </button>
      </div>
    );
  }

  const built = picked.map((si) => shuffled[si]);

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: 8 }}>
        <span className="badge badge-gold">{idx + 1}/{order.length}</span>
        <span className="badge badge-accent">+{score}</span>
        <span style={{ flex: 1 }} />
        <button
          className="btn btn-sm btn-gold"
          onClick={askHelper}
          disabled={checked !== null || hintUsed}
          title="Подсказка: первое слово"
          style={{ borderRadius: "50%", width: 36, height: 36, padding: 0, fontSize: "1rem" }}
        >
          🐱
        </button>
        <button className="btn btn-sm btn-ghost" onClick={() => { setFinished(true); onDone(score); }}>
          <Flag size={13} /> Завершить
        </button>
      </div>

      <div className="card">
        <p style={{ fontSize: "0.72rem", color: "var(--fg-muted)", textAlign: "center" }}>
          собери предложение • «{sentence.ru}»
        </p>

        {/* Собранная строка */}
        <div
          style={{
            minHeight: 56, borderRadius: "0.9rem", border: "2px dashed var(--border)",
            margin: "10px 0", padding: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.4rem",
            alignItems: "center", justifyContent: "center",
            borderColor: checked === true ? "var(--success)" : checked === false ? "var(--danger)" : "var(--border)",
            background: checked === true ? "color-mix(in srgb, var(--success) 10%, transparent)" : "transparent",
          }}
        >
          {built.length === 0 && (
            <span style={{ color: "var(--fg-muted)", fontSize: "0.8rem" }}>нажимай на слова ниже…</span>
          )}
          {built.map((w, i) => (
            <span key={i} className="badge badge-accent" style={{ fontSize: "0.85rem", textTransform: "none" }}>{w}</span>
          ))}
        </div>

        {/* Слова вразнобой */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", justifyContent: "center" }}>
          {shuffled.map((w, si) => {
            const used = picked.includes(si);
            return (
              <button
                key={si}
                onClick={() => tapWord(si)}
                disabled={used || checked !== null}
                className="btn btn-sm"
                style={{
                  background: used ? "var(--track)" : "var(--surface-2)",
                  color: used ? "var(--fg-muted)" : "var(--fg)",
                  border: "1px solid var(--border)",
                  opacity: used ? 0.4 : 1,
                }}
              >
                {w}
              </button>
            );
          })}
        </div>

        {checked === false && (
          <p className="animate-pop" style={{ textAlign: "center", fontSize: "0.8rem", marginTop: 8, color: "var(--danger)", fontWeight: 700 }}>
            Правильно: «{sentence.tt.join(" ")}»
          </p>
        )}
        {checked === true && (
          <p className="animate-pop" style={{ textAlign: "center", fontSize: "0.8rem", marginTop: 8, color: "var(--success)", fontWeight: 700 }}>
            ✅ Дөрес! +{POINTS_PER_SENTENCE}
          </p>
        )}
        {hintUsed && checked === null && (
          <p style={{ textAlign: "center", fontSize: "0.72rem", marginTop: 6, color: "var(--gold)" }}>
            <Lightbulb size={12} style={{ display: "inline" }} /> Помощник подставил первое слово
          </p>
        )}

        <div style={{ display: "flex", gap: "0.5rem", marginTop: 10 }}>
          <button className="btn btn-ghost" onClick={undo} disabled={picked.length === 0 || checked !== null} style={{ flex: 1 }}>
            <Delete size={15} /> Стереть
          </button>
          <button
            className="btn btn-primary"
            onClick={check}
            disabled={picked.length !== sentence.tt.length || checked !== null}
            style={{ flex: 2 }}
          >
            Проверить
          </button>
        </div>
      </div>
    </div>
  );
}

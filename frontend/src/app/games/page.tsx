"use client";

import { useState, useEffect, useCallback } from "react";
import { useStore } from "@/store/use-store";

const GAMES = [
  { id: "word-guess", title: "Угадай слово", icon: "🎯", desc: "Выбери правильный перевод", color: "var(--accent)" },
  { id: "speed-translate", title: "Быстрый перевод", icon: "⚡", desc: "Чем быстрее, тем больше поинтов", color: "var(--gold)" },
  { id: "truefalse-speed", title: "Правда или ложь", icon: "❓", desc: "Быстро отвечай да или нет", color: "var(--accent)" },
];

const WORD_SETS = [
  { word: "Сәлам", options: ["Привет", "Пока", "Спасибо", "Пожалуйста"], correct: "Привет" },
  { word: "Рәхмәт", options: ["Извини", "Спасибо", "Привет", "Пожалуйста"], correct: "Спасибо" },
  { word: "Ипек", options: ["Чай", "Вода", "Хлеб", "Молоко"], correct: "Хлеб" },
  { word: "Чәй", options: ["Вода", "Чай", "Сок", "Молоко"], correct: "Чай" },
  { word: "Мәчә", options: ["Собака", "Кошка", "Птица", "Рыба"], correct: "Кошка" },
  { word: "Эт", options: ["Кошка", "Лошадь", "Собака", "Корова"], correct: "Собака" },
  { word: "Зур", options: ["Маленький", "Красивый", "Большой", "Хороший"], correct: "Большой" },
  { word: "Кече", options: ["Большой", "Красивый", "Маленький", "Грустный"], correct: "Маленький" },
  { word: "Яхшы", options: ["Плохо", "Хорошо", "Быстро", "Медленно"], correct: "Хорошо" },
  { word: "Су", options: ["Огонь", "Земля", "Вода", "Воздух"], correct: "Вода" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function WordGuess({ onDone }: { onDone: (pts: number) => void }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const [questions] = useState(() => shuffle(WORD_SETS).slice(0, 5));

  if (idx >= questions.length) {
    return (
      <div style={{ textAlign: "center", padding: "2rem 0" }}>
        <div style={{ fontSize: "2rem" }}>🎉</div>
        <div style={{ fontWeight: 700, marginTop: 8 }}>Игра окончена!</div>
        <div style={{ color: "var(--gold)", fontSize: "1.1rem", marginTop: 4 }}>+{score} поинтов</div>
        <button className="btn btn-gold" onClick={() => onDone(score)} style={{ marginTop: 12 }}>Готово</button>
      </div>
    );
  }

  const q = questions[idx];
  const shuffledOpts = shuffle(q.options);

  const handlePick = (opt: string) => {
    if (show) return;
    setPicked(opt);
    setShow(true);
    if (opt === q.correct) setScore((s) => s + 10);
    setTimeout(() => { setIdx((i) => i + 1); setPicked(null); setShow(false); }, 1200);
  };

  return (
    <div>
      <div style={{ fontSize: "0.7rem", color: "var(--fg-muted)", marginBottom: 8 }}>{idx + 1}/{questions.length}</div>
      <p style={{ fontWeight: 700, fontSize: "1.1rem", textAlign: "center", marginBottom: 12 }}>
        Как будет «{q.word}»?
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {shuffledOpts.map((opt) => {
          let bg = "var(--surface)";
          let bc = "var(--border)";
          if (show) {
            if (opt === q.correct) { bg = "var(--accent-soft)"; bc = "var(--success)"; }
            else if (opt === picked) { bg = "var(--danger-soft)"; bc = "var(--danger)"; }
          }
          return (
            <button key={opt} onClick={() => handlePick(opt)}
              style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "2px solid " + bc, background: bg, color: "var(--fg)", fontWeight: 600, cursor: show ? "default" : "pointer", textAlign: "center" }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SpeedTranslate({ onDone }: { onDone: (pts: number) => void }) {
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(30);
  const [q, setQ] = useState(() => WORD_SETS[Math.floor(Math.random() * WORD_SETS.length)]);
  const [picked, setPicked] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (time <= 0) { onDone(score); return; }
    const t = setTimeout(() => setTime((t) => t - 1), 1000);
    return () => clearTimeout(t);
  }, [time, score, onDone]);

  const nextQ = () => {
    setQ(WORD_SETS[Math.floor(Math.random() * WORD_SETS.length)]);
    setPicked(null);
    setShow(false);
  };

  const handlePick = (opt: string) => {
    if (show) return;
    setPicked(opt);
    setShow(true);
    if (opt === q.correct) setScore((s) => s + 10);
    setTimeout(nextQ, 600);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span className="badge badge-gold">+{score} 💰</span>
        <span className="badge badge-danger">⏱ {time}с</span>
      </div>
      <p style={{ fontWeight: 700, fontSize: "1.1rem", textAlign: "center", marginBottom: 12 }}>
        «{q.word}» = ?
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        {shuffle(q.options).map((opt) => {
          let bc = "var(--border)";
          if (show && opt === q.correct) bc = "var(--success)";
          else if (show && opt === picked) bc = "var(--danger)";
          return (
            <button key={opt} onClick={() => handlePick(opt)}
              style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "2px solid " + bc, background: "var(--surface)", color: "var(--fg)", fontWeight: 600, cursor: "pointer", textAlign: "center" }}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function GamesPage() {
  const { addPoints } = useStore();
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const handleDone = useCallback((pts: number) => {
    if (pts > 0) addPoints(pts);
    setActiveGame(null);
  }, [addPoints]);

  if (activeGame === "word-guess") return <div className="page-shell"><WordGuess onDone={handleDone} /></div>;
  if (activeGame === "speed-translate") return <div className="page-shell"><SpeedTranslate onDone={handleDone} /></div>;

  return (
    <div className="page-shell">
      <div>
        <h1 className="page-title">Мини-игры</h1>
        <p className="page-subtitle">Играй и зарабатывай поинты</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {GAMES.map((g) => (
          <button key={g.id} onClick={() => setActiveGame(g.id)}
            className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", textAlign: "left", cursor: "pointer", border: "2px solid var(--border)" }}>
            <div style={{ fontSize: "2rem", width: 48, textAlign: "center" }}>{g.icon}</div>
            <div>
              <div style={{ fontWeight: 700, color: "var(--fg)" }}>{g.title}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>{g.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flag, RotateCcw, Play, Lightbulb } from "lucide-react";
import { VOCAB, type VocabWord } from "@/games/words";
import { translateViaApi } from "@/lib/api";

// ============================================================
// «Сүзләр» (Слова) по ТЗ: слово на русском — выбери перевод
// на татарский из 4 вариантов. 10 раундов, +10 за верный.
// В правом верхнем углу — помощник: подсказка по слову.
// Слова берутся из общего словаря, без повторов в партии.
// ============================================================

const ROUNDS = 10;
const POINTS_PER_WORD = 10;

interface Q {
  ru: string;
  correct: string;
  options: string[];
  hint: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuiz(): Q[] {
  const words: VocabWord[] = shuffle(VOCAB).slice(0, ROUNDS);
  return words.map((w) => {
    const distract = shuffle(VOCAB.filter((x) => x.tt !== w.tt && x.level === w.level))
      .slice(0, 3)
      .map((x) => x.tt);
    while (distract.length < 3) {
      const extra = VOCAB[Math.floor(Math.random() * VOCAB.length)]!;
      if (extra.tt !== w.tt && !distract.includes(extra.tt)) distract.push(extra.tt);
    }
    return {
      ru: w.ru,
      correct: w.tt,
      options: shuffle([w.tt, ...distract]),
      hint: `Первая буква: «${w.tt.charAt(0)}» • букв: ${w.tt.replace(/ /g, "").length}`,
    };
  });
}

export function SuzlarGame({ onDone }: { onDone: (basePoints: number) => void }) {
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState<string>("");
  const [finished, setFinished] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    setQuestions(buildQuiz());
    setIdx(0);
    setScore(0);
    setPicked(null);
    setShowHint(false);
    setHintText("");
    setFinished(false);
  }, []);

  useEffect(() => {
    start();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [start]);

  // Подсказка помощника: локальный хинт + живой пример через API перевода
  const askHelper = useCallback(async () => {
    const q = questions[idx];
    if (!q || picked) return;
    setShowHint(true);
    setHintText(q.hint);
    // живой пример: переводим русское слово обратно для самопроверки
    const live = await translateViaApi(q.ru, "ru", "tt");
    if (live) setHintText((h) => `${h} • переводчик: «${live}»`);
  }, [questions, idx, picked]);

  const pick = (opt: string) => {
    if (picked || finished) return;
    const q = questions[idx]!;
    setPicked(opt);
    const ok = opt === q.correct;
    if (ok) setScore((s) => s + POINTS_PER_WORD);
    timer.current = setTimeout(() => {
      if (idx + 1 >= questions.length) {
        setFinished(true);
        onDone(score + (ok ? POINTS_PER_WORD : 0));
      } else {
        setIdx((i) => i + 1);
        setPicked(null);
        setShowHint(false);
        setHintText("");
      }
    }, 900);
  };

  if (questions.length === 0) return null;
  const q = questions[idx]!;

  if (finished) {
    return (
      <div className="card card-gold animate-pop" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2.2rem" }}>🎉</div>
        <div style={{ fontWeight: 800, marginTop: 4 }}>10 раундов пройдено!</div>
        <div style={{ color: "var(--gold)", fontWeight: 800, fontSize: "1.2rem", marginTop: 4 }}>
          +{score} баллов
        </div>
        <button className="btn btn-gold" onClick={start} style={{ marginTop: 10, width: "100%" }}>
          <RotateCcw size={16} /> Ещё раз
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: 8 }}>
        <span className="badge badge-gold">Раунд {idx + 1}/{questions.length}</span>
        <span className="badge badge-accent">+{score}</span>
        <span style={{ flex: 1 }} />
        {/* помощник в правом верхнем углу */}
        <button
          className="btn btn-sm btn-gold"
          onClick={askHelper}
          disabled={!!picked}
          title="Подсказка помощника"
          style={{ borderRadius: "50%", width: 36, height: 36, padding: 0, fontSize: "1rem" }}
        >
          🐱
        </button>
        <button className="btn btn-sm btn-ghost" onClick={() => { setFinished(true); onDone(score); }}>
          <Flag size={13} /> Завершить
        </button>
      </div>

      {showHint && (
        <div className="card card-gold animate-pop" style={{ marginBottom: 8, padding: "0.6rem 0.8rem", fontSize: "0.8rem" }}>
          <Lightbulb size={14} style={{ display: "inline", marginRight: 6, color: "var(--gold)" }} />
          {hintText || q.hint}
        </div>
      )}

      <div className="card">
        <p style={{ fontSize: "0.72rem", color: "var(--fg-muted)", textAlign: "center" }}>как будет по-татарски?</p>
        <p className="font-display" style={{ fontWeight: 700, fontSize: "1.4rem", textAlign: "center", margin: "8px 0 12px" }}>
          {q.ru}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {q.options.map((opt) => {
            let cls = "quiz-opt";
            if (picked) {
              if (opt === q.correct) cls += " correct";
              else if (opt === picked) cls += " wrong";
            }
            return (
              <button key={opt} className={cls} disabled={!!picked} onClick={() => pick(opt)}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

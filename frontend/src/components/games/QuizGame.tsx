"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flag, RotateCcw, Play, Flame, Trophy } from "lucide-react";
import { VOCAB, pointsForStreak, streakMessage, type VocabWord } from "@/games/words";
import { getQuizBest, getQuizStreak, saveQuizBest, saveQuizStreak } from "@/games/storage";

// ============================================================
// «Словарный вызов»: викторина татарский → русский, 4 варианта.
// Пул 72 слова / 3 уровня, без повторов (окно недавних).
// Серия даёт множитель x1/x2/x3/x5. Таймер на ответ — настраиваемый.
// Рекорды очков и серии — в localStorage.
// ============================================================

type QuizStatus = "idle" | "playing" | "over";
type LevelMode = "auto" | 1 | 2 | 3;
type TimerMode = 0 | 5 | 10 | 15; // 0 — без таймера

interface Question {
  word: VocabWord;
  options: string[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Сборка вопроса: верный ответ + 3 дистрактора (сначала свой уровень)
function buildQuestion(word: VocabWord, recentRu: Set<string>): Question {
  const sameLevel = shuffle(VOCAB.filter((w) => w.level === word.level && w.ru !== word.ru));
  const others = shuffle(VOCAB.filter((w) => w.level !== word.level && w.ru !== word.ru));
  const distractors: string[] = [];
  for (const w of [...sameLevel, ...others]) {
    if (distractors.length >= 3) break;
    if (!recentRu.has(w.ru) && !distractors.includes(w.ru)) distractors.push(w.ru);
  }
  return { word, options: shuffle([word.ru, ...distractors]) };
}

// Выбор уровня слова: auto растёт вместе с серией
function pickLevel(mode: LevelMode, streak: number): 1 | 2 | 3 {
  if (mode !== "auto") return mode;
  if (streak >= 10) return ([2, 3] as const)[Math.floor(Math.random() * 2)];
  if (streak >= 5) return ([1, 2] as const)[Math.floor(Math.random() * 2)];
  return 1;
}

export function QuizGame({ onDone }: { onDone: (storePoints: number) => void }) {
  const [status, setStatus] = useState<QuizStatus>("idle");
  const [levelMode, setLevelMode] = useState<LevelMode>("auto");
  const [timerMode, setTimerMode] = useState<TimerMode>(10);
  const [question, setQuestion] = useState<Question | null>(null);
  const [qNum, setQNum] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [best, setBest] = useState(0);
  const [bestStreakEver, setBestStreakEver] = useState(0);
  const [newRecord, setNewRecord] = useState(false);

  // пул оставшихся слов + окно недавних (защита от повторов)
  const poolRef = useRef<VocabWord[]>([]);
  const recentRef = useRef<string[]>([]); // tt последних 12
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setBest(getQuizBest());
    setBestStreakEver(getQuizStreak());
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Пауза таймера при скрытии вкладки — останавливаем интервал
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setMsg("⏸ Пауза — вернись и нажми «Продолжить»");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const nextQuestion = useCallback((curStreak: number, mode: LevelMode) => {
    // пополняем пул, исключая недавние
    if (poolRef.current.length === 0) {
      poolRef.current = shuffle(VOCAB.filter((w) => !recentRef.current.includes(w.tt)));
      if (poolRef.current.length === 0) {
        recentRef.current = [];
        poolRef.current = shuffle(VOCAB);
      }
    }
    // берём слово подходящего уровня
    const want = pickLevel(mode, curStreak);
    let idx = poolRef.current.findIndex((w) => w.level === want);
    if (idx < 0) idx = 0;
    const [word] = poolRef.current.splice(idx, 1);
    recentRef.current.push(word.tt);
    if (recentRef.current.length > 12) recentRef.current.shift();

    const q = buildQuestion(word, new Set(poolRef.current.map((w) => w.ru)));
    setQuestion(q);
    setQNum((n) => n + 1);
    setPicked(null);
    setMsg(null);
  }, []);

  const startTimer = useCallback((seconds: number, onTimeout: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (seconds <= 0) {
      setTimeLeft(0);
      return;
    }
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.2) {
          if (timerRef.current) clearInterval(timerRef.current);
          onTimeout();
          return 0;
        }
        return +(t - 0.2).toFixed(1);
      });
    }, 200);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startGame = useCallback(() => {
    poolRef.current = shuffle(VOCAB);
    recentRef.current = [];
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setQNum(0);
    setNewRecord(false);
    setStatus("playing");
    // первый вопрос — чуть позже, чтобы state успел обновиться
    setTimeout(() => nextQuestion(0, levelMode), 0);
  }, [levelMode, nextQuestion]);

  // Таймер запускаем на каждый новый вопрос
  useEffect(() => {
    if (status !== "playing" || !question || picked) return;
    startTimer(timerMode, () => {
      // время вышло = ошибка
      handleTimeout();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, status]);

  const scheduleNext = useCallback((curStreak: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => nextQuestion(curStreak, levelMode), 850);
  }, [levelMode, nextQuestion]);

  const handleTimeout = useCallback(() => {
    if (picked || !question) return;
    stopTimer();
    setPicked("__timeout__");
    setCorrect(false);
    setStreak(0);
    setMsg(`⏰ Время вышло! Правильно: «${question.word.ru}»`);
    scheduleNext(0);
  }, [picked, question, stopTimer, scheduleNext]);

  const handlePick = useCallback((opt: string) => {
    if (picked || !question || status !== "playing") return;
    stopTimer();
    const ok = opt === question.word.ru;
    setPicked(opt);
    setCorrect(ok);
    if (ok) {
      const ns = streak + 1;
      const pts = pointsForStreak(ns);
      setStreak(ns);
      setBestStreak((b) => Math.max(b, ns));
      setScore((sc) => sc + pts);
      const sm = streakMessage(ns);
      setMsg(sm ?? `✅ +${pts}`);
      scheduleNext(ns);
    } else {
      setStreak(0);
      setMsg(`❌ Правильно: «${question.word.ru}»`);
      scheduleNext(0);
    }
  }, [picked, question, status, stopTimer, streak, scheduleNext]);

  const finishGame = useCallback(() => {
    stopTimer();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const rb = saveQuizBest(score);
    const rs = saveQuizStreak(bestStreak);
    setNewRecord(rb || rs);
    setBest(getQuizBest());
    setBestStreakEver(getQuizStreak());
    setStatus("over");
    // в общий стор: 1 поинт за 2 очка викторины, макс 100
    onDone(Math.min(100, Math.floor(score / 2)));
  }, [stopTimer, score, bestStreak, onDone]);

  const timerPct = useMemo(() => {
    if (timerMode <= 0) return 0;
    return Math.max(0, Math.min(100, (timeLeft / timerMode) * 100));
  }, [timeLeft, timerMode]);

  // ---------- экраны ----------
  if (status === "idle") {
    return (
      <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div className="card card-gold">
          <div style={{ fontWeight: 800, fontSize: "1rem" }}>📚 Словарный вызов</div>
          <p style={{ fontSize: "0.8rem", color: "var(--fg-muted)", marginTop: 6, lineHeight: 1.5 }}>
            Переводи с татарского на русский. Серия правильных ответов умножает очки:
            5+ — x2, 10+ — x3, 20+ — x5. В словаре 72 слова трёх уровней.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: 8, flexWrap: "wrap" }}>
            <span className="badge badge-gold">Рекорд: {best}</span>
            <span className="badge badge-accent">Серия: {bestStreakEver}</span>
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 800, fontSize: "0.8rem", marginBottom: 8 }}>Уровень слов</div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {(["auto", 1, 2, 3] as LevelMode[]).map((l) => (
              <button
                key={String(l)}
                onClick={() => setLevelMode(l)}
                className={"btn btn-sm " + (levelMode === l ? "btn-primary" : "btn-ghost")}
              >
                {l === "auto" ? "🎲 Авто" : `Ур. ${l}`}
              </button>
            ))}
          </div>
          <div style={{ fontWeight: 800, fontSize: "0.8rem", margin: "12px 0 8px" }}>Таймер на ответ</div>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {([0, 5, 10, 15] as TimerMode[]).map((t) => (
              <button
                key={t}
                onClick={() => setTimerMode(t)}
                className={"btn btn-sm " + (timerMode === t ? "btn-gold" : "btn-ghost")}
              >
                {t === 0 ? "∞" : `${t}с`}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-gold" onClick={startGame}>
          <Play size={16} /> Начать вызов
        </button>
      </div>
    );
  }

  if (status === "over") {
    return (
      <div className="card card-gold animate-pop" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2.2rem" }}>🏁</div>
        <div style={{ fontWeight: 800, fontSize: "1.05rem", marginTop: 4 }}>Вызов завершён!</div>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
          <span className="badge badge-gold"><Trophy size={12} /> {score} очков</span>
          <span className="badge badge-accent"><Flame size={12} /> серия {bestStreak}</span>
          <span className="badge badge-accent">{qNum} вопросов</span>
        </div>
        {newRecord && (
          <div className="badge badge-gold" style={{ marginTop: 8 }}>🏆 Новый рекорд!</div>
        )}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: 12 }}>
          <button className="btn btn-gold" onClick={startGame} style={{ flex: 1 }}>
            <RotateCcw size={16} /> Ещё раз
          </button>
        </div>
      </div>
    );
  }

  // ---------- игра ----------
  return (
    <div className="animate-fade-in">
      {/* HUD */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <span className="badge badge-gold">Счёт: {score}</span>
        <span className="badge badge-accent"><Flame size={12} /> {streak}</span>
        <span className="badge badge-accent">Рекорд: {Math.max(best, score)}</span>
        <span className="badge badge-gold">● Игра</span>
        <span style={{ flex: 1 }} />
        <button className="btn btn-sm btn-ghost" onClick={finishGame}>
          <Flag size={13} /> Завершить
        </button>
      </div>

      {/* Таймер */}
      {timerMode > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div className="timer-bar">
            <div className="timer-fill" style={{ width: `${timerPct}%` }} />
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--fg-muted)", marginTop: 3, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
            {timeLeft.toFixed(1)}с
          </div>
        </div>
      )}

      {question && (
        <div className="card" key={qNum}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.7rem", color: "var(--fg-muted)" }}>Вопрос {qNum}</span>
            <span className="badge badge-accent">Уровень {question.word.level}</span>
          </div>
          <p className="font-display" style={{ fontWeight: 700, fontSize: "1.5rem", textAlign: "center", margin: "12px 0", color: "var(--fg)" }}>
            {question.word.tt}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", textAlign: "center", marginBottom: 12 }}>
            выбери перевод на русский
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {question.options.map((opt) => {
              let cls = "quiz-opt";
              if (picked) {
                if (opt === question.word.ru) cls += " correct";
                else if (opt === picked) cls += " wrong";
              }
              return (
                <button key={opt} className={cls} disabled={!!picked} onClick={() => handlePick(opt)}>
                  {opt}
                </button>
              );
            })}
          </div>
          {msg && (
            <div
              className="animate-pop"
              style={{
                marginTop: 10, textAlign: "center", fontWeight: 800, fontSize: "0.85rem",
                color: correct ? "var(--success)" : "var(--danger)",
              }}
            >
              {msg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

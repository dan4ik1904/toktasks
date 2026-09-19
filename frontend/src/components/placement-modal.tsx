"use client";

import { useState } from "react";
import { useStore } from "@/store/use-store";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { haptic } from "@/lib/telegram";

const PLACEMENT_QUESTIONS = [
  {
    q: "Как переводится слово «Сәлам»?",
    options: ["Привет", "Пока", "Спасибо", "До свидания"],
    answer: "Привет",
  },
  {
    q: "Выберите правильный перевод: «Мин татарча сөйләшәм»",
    options: ["Я люблю татарский", "Я говорю по-татарски", "Я учу татарский", "Я из Татарстана"],
    answer: "Я говорю по-татарски",
  },
  {
    q: "Какой звук обозначает буква «Ә» в татарском языке?",
    options: ["Мягкий А (как в английском cat)", "Твердый О", "Носовой Н", "Глухой Ш"],
    answer: "Мягкий А (как в английском cat)",
  },
];

export function PlacementModal() {
  const { points, addPoints, completeTopic } = useStore();
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("tatarcha-placement-done");
  });
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!open) return null;

  const handleAnswer = (opt: string) => {
    haptic("medium");
    const correct = opt === PLACEMENT_QUESTIONS[step].answer;
    const newScore = correct ? score + 1 : score;
    setScore(newScore);

    if (step < PLACEMENT_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setFinished(true);
      localStorage.setItem("tatarcha-placement-done", "true");
      if (newScore >= 2) {
        addPoints(50);
        completeTopic("alphabet");
        completeTopic("greetings");
      }
    }
  };

  const finish = () => {
    haptic("heavy");
    setOpen(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet animate-slide-up" style={{ textAlign: "center", padding: "1.5rem" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--gold-soft)", border: "2px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", margin: "0 auto 1rem" }}>
          🐆
        </div>
        <div className="badge badge-gold" style={{ marginBottom: 8 }}>
          <Sparkles size={12} /> Ак Барс • Тест уровня
        </div>
        {!finished ? (
          <>
            <h2 className="font-display" style={{ fontSize: "1.1rem", marginBottom: 6 }}>Определим ваш уровень татарского</h2>
            <p style={{ fontSize: "0.8rem", color: "var(--fg-muted)", marginBottom: 16 }}>
              Вопрос {step + 1} из {PLACEMENT_QUESTIONS.length}
            </p>
            <p style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 16 }}>{PLACEMENT_QUESTIONS[step].q}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {PLACEMENT_QUESTIONS[step].options.map((opt, i) => (
                <button
                  key={i}
                  className="btn btn-ghost"
                  onClick={() => handleAnswer(opt)}
                  style={{ justifyContent: "center", textAlign: "center", padding: "0.8rem" }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <CheckCircle2 size={48} style={{ color: "var(--success)", margin: "0 auto 8px" }} />
            <h2 className="font-display" style={{ fontSize: "1.2rem", marginBottom: 6 }}>Тест пройден!</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--fg-muted)", marginBottom: 16 }}>
              {score >= 2 ? "Отлично! Вам открыты базовые и средние темы, +50 бонусов 💰" : "Начнем с самого начала: алфавит и основы фонетики."}
            </p>
            <button className="btn btn-primary" onClick={finish} style={{ width: "100%" }}>
              Начать обучение
            </button>
          </>
        )}
      </div>
    </div>
  );
}

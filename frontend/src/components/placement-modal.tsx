"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/store/use-store";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { haptic } from "@/lib/telegram";

export type ProficiencyLevel = "beginner" | "elementary" | "intermediate" | "advanced";

export const LEVEL_NAMES: Record<ProficiencyLevel, { title: string; titleTt: string; desc: string }> = {
  beginner: { title: "Начинающий", titleTt: "Бала / Әлифба", desc: "Алфавит, правила чтения и базовые приветствия" },
  elementary: { title: "Базовый", titleTt: "Үсмер / Гади сүзләр", desc: "Простые фразы, обиходные слова и числа" },
  intermediate: { title: "Средний", titleTt: "Олы / Сөйләшү", desc: "Грамматика, времена глаголов и диалоги" },
  advanced: { title: "Продвинутый", titleTt: "Мастер / Ирекле", desc: "Сложные конструкции, идиомы и свободная речь" },
};

const PLACEMENT_QUESTIONS = [
  {
    level: "beginner",
    q: "Как переводится слово «Сәлам»?",
    options: ["Привет", "Пока", "Спасибо", "До свидания"],
    answer: "Привет",
  },
  {
    q: "Какой звук обозначает буква «Ә» в татарском языке?",
    options: ["Мягкий А (как в cat)", "Твердый О", "Носовой Н", "Глухой Ш"],
    answer: "Мягкий А (как в cat)",
  },
  {
    level: "elementary",
    q: "Выберите правильный перевод: «Мин Казаннан»",
    options: ["Я из Казани", "Я люблю Казань", "Я еду в Казань", "Это Казань"],
    answer: "Я из Казани",
  },
  {
    q: "Как сказать по-татарски «Спасибо»?",
    options: ["Рәхмәт", "Сау булыгыз", "Хәерле көн", "Гафу итегез"],
    answer: "Рәхмәт",
  },
  {
    level: "intermediate",
    q: "Выберите правильную форму прошедшего времени глагола «бару» (идти) для местоимения «мин» (я):",
    options: ["мин бардым", "мин барам", "мин барачакмын", "мин барырмын"],
    answer: "мин бардым",
  },
  {
    q: "Что означает фраза «Күрешкәнче!»?",
    options: ["До свидания / Увидимся!", "Приятного аппетита!", "Доброе утро!", "С днем рождения!"],
    answer: "До свидания / Увидимся!",
  },
  {
    level: "advanced",
    q: "Выберите татарскую пословицу, означающую «Знание — свет»:",
    options: ["Белем — нур, белмәү — хур", "Дуслык — иң зур байлык", "Эш беткәч — уйнарга ярый", "Тел — тарих көзгесе"],
    answer: "Белем — нур, белмәү — хур",
  },
];

export function PlacementModal() {
  const { userLevel, setUserLevel, addPoints, completeTopic } = useStore();
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [resultLevel, setResultLevel] = useState<ProficiencyLevel | null>(null);

  // Перемешиваем варианты ответов случайно для каждого вопроса, чтобы правильный ответ не стоял всегда первым
  const shuffledOptions = useMemo(() => {
    const q = PLACEMENT_QUESTIONS[step];
    return [...q.options].sort(() => Math.random() - 0.5);
  }, [step]);

  if (userLevel !== null) return null;

  const handleAnswer = (opt: string) => {
    haptic("medium");
    const correct = opt === PLACEMENT_QUESTIONS[step].answer;
    const newScore = correct ? score + 1 : score;
    setScore(newScore);

    if (step < PLACEMENT_QUESTIONS.length - 1) {
      setStep((s) => s + 1);
    } else {
      let lvl: ProficiencyLevel = "beginner";
      if (newScore >= 7) lvl = "advanced";
      else if (newScore >= 5) lvl = "intermediate";
      else if (newScore >= 3) lvl = "elementary";
      else lvl = "beginner";

      setResultLevel(lvl);
      setUserLevel(lvl);
      addPoints(100);

      if (lvl === "advanced") {
        completeTopic("alphabet");
        completeTopic("greetings");
        completeTopic("family");
      } else if (lvl === "intermediate") {
        completeTopic("alphabet");
        completeTopic("greetings");
      } else if (lvl === "elementary") {
        completeTopic("alphabet");
      }
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
    }}>
      <div className="card animate-slide-up" style={{ width: "100%", maxWidth: 520, textAlign: "center", padding: "2rem 1.5rem", border: "2px solid var(--gold)" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--gold-soft)", border: "2px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", margin: "0 auto 1rem" }}>
          🐆
        </div>
        <div className="badge badge-gold" style={{ marginBottom: 10 }}>
          <Sparkles size={12} /> Ак Барс • Обязательное тестирование
        </div>

        {!resultLevel ? (
          <>
            <h1 className="font-display" style={{ fontSize: "1.25rem", marginBottom: 6 }}>Определяем ваш уровень</h1>
            <p style={{ fontSize: "0.85rem", color: "var(--fg-muted)", marginBottom: 20 }}>
              Вопрос {step + 1} из {PLACEMENT_QUESTIONS.length}. Без этого теста продолжение работы невозможно.
            </p>
            <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 20, lineHeight: 1.4 }}>
              {PLACEMENT_QUESTIONS[step].q}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {shuffledOptions.map((opt, i) => (
                <button
                  key={i}
                  className="btn btn-ghost"
                  onClick={() => handleAnswer(opt)}
                  style={{ justifyContent: "center", textAlign: "center", padding: "0.9rem", fontSize: "0.95rem" }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="animate-pop">
            <CheckCircle2 size={56} style={{ color: "var(--success)", margin: "0 auto 12px" }} />
            <h2 className="font-display" style={{ fontSize: "1.35rem", marginBottom: 8 }}>Тест успешно завершен!</h2>
            <div style={{ padding: "1rem", borderRadius: "1rem", background: "var(--surface-2)", margin: "1rem 0" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)", textTransform: "uppercase" }}>Ваш зафиксированный уровень:</div>
              <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--gold)", marginTop: 4 }}>
                {LEVEL_NAMES[resultLevel].title} ({LEVEL_NAMES[resultLevel].titleTt})
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--fg-muted)", marginTop: 4 }}>
                {LEVEL_NAMES[resultLevel].desc}
              </p>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--fg-muted)", marginBottom: 20 }}>
              Учебная программа и ИИ-репетитор настроены под ваш уровень. Бонус: +100 XP 💰
            </p>
            <button className="btn btn-primary" onClick={() => window.location.reload()} style={{ width: "100%", padding: "0.9rem" }}>
              Войти в приложение
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

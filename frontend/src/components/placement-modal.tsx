"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/store/use-store";
import { TOPICS } from "@/data/topics";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { haptic } from "@/lib/telegram";

export type ProficiencyLevel = "beginner" | "elementary" | "intermediate" | "advanced";

export const LEVEL_ORDER: ProficiencyLevel[] = ["beginner", "elementary", "intermediate", "advanced"];

export const LEVEL_TO_DIFFICULTY: Record<ProficiencyLevel, 1 | 2 | 3 | 4> = {
  beginner: 1,
  elementary: 2,
  intermediate: 3,
  advanced: 4,
};

export const LEVEL_NAMES: Record<ProficiencyLevel, { title: string; titleTt: string; desc: string }> = {
  beginner: { title: "Начинающий", titleTt: "Бала / Әлифба", desc: "Алфавит, правила чтения и базовые приветствия" },
  elementary: { title: "Базовый", titleTt: "Үсмер / Гади сүзләр", desc: "Простые фразы, обиходные слова и числа" },
  intermediate: { title: "Средний", titleTt: "Олы / Сөйләшү", desc: "Грамматика, времена глаголов и диалоги" },
  advanced: { title: "Продвинутый", titleTt: "Мастер / Ирекле", desc: "Сложные конструкции, идиомы и свободная речь" },
};

interface PlacementQuestion {
  level: ProficiencyLevel;
  q: string;
  options: string[];
  answer: string;
}

// 20 вопросов с нарастающей сложностью: 5 + 5 + 5 + 5
const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // ---- A1 · Начинающий: алфавит, приветствия, числа ----
  { level: "beginner", q: "Как переводится слово «Сәлам»?", options: ["Привет", "Пока", "Спасибо", "До свидания"], answer: "Привет" },
  { level: "beginner", q: "Какой звук обозначает буква «Ә» в татарском языке?", options: ["Мягкий А (как в cat)", "Твёрдый О", "Носовой Н", "Глухой Ш"], answer: "Мягкий А (как в cat)" },
  { level: "beginner", q: "Сколько букв в татарском кириллическом алфавите?", options: ["39", "33", "26", "42"], answer: "39" },
  { level: "beginner", q: "Как сказать «До свидания» (вежливо)?", options: ["Сау булыгыз", "Сәлам", "Хәерле кич", "Рәхмәт"], answer: "Сау булыгыз" },
  { level: "beginner", q: "Как будет «один» по-татарски?", options: ["Бер", "Ике", "Өч", "Дүрт"], answer: "Бер" },
  // ---- A2 · Базовый: фразы, семья, обиход ----
  { level: "elementary", q: "Выберите правильный перевод: «Мин Казаннан»", options: ["Я из Казани", "Я люблю Казань", "Я еду в Казань", "Это Казань"], answer: "Я из Казани" },
  { level: "elementary", q: "Как сказать по-татарски «Спасибо»?", options: ["Рәхмәт", "Сау булыгыз", "Хәерле көн", "Гафу итегез"], answer: "Рәхмәт" },
  { level: "elementary", q: "Что означает слово «Әни»?", options: ["Мама", "Папа", "Сестра", "Брат"], answer: "Мама" },
  { level: "elementary", q: "«Сигез» — это число…", options: ["8", "5", "3", "10"], answer: "8" },
  { level: "elementary", q: "Инфинитив глагола «любить» по-татарски — …", options: ["яратырга", "яратам", "яратты", "ярат"], answer: "яратырга" },
  // ---- B1 · Средний: времена, падежи, диалоги ----
  { level: "intermediate", q: "Выберите правильную форму прошедшего времени глагола «бару» (идти) для «мин» (я):", options: ["мин бардым", "мин барам", "мин барачакмын", "мин барырмын"], answer: "мин бардым" },
  { level: "intermediate", q: "Что означает фраза «Күрешкәнче!»?", options: ["До свидания / Увидимся!", "Приятного аппетита!", "Доброе утро!", "С днём рождения!"], answer: "До свидания / Увидимся!" },
  { level: "intermediate", q: "Что означает фраза «Мин мәктәптән өйгә барам»?", options: ["Я иду из школы домой", "Я иду в школу", "Я живу дома", "Я люблю школу"], answer: "Я иду из школы домой" },
  { level: "intermediate", q: "Выберите форму будущего времени: «Иртәгә мин Казанга ___» (Завтра я поеду в Казань)", options: ["барачакмын", "бардым", "барам", "бармадым"], answer: "барачакмын" },
  { level: "intermediate", q: "Что означает «Синең өчен»?", options: ["Для тебя", "С тобой", "У тебя", "От тебя"], answer: "Для тебя" },
  // ---- B2 · Продвинутый: идиомы, культура, сложный синтаксис ----
  { level: "advanced", q: "Выберите татарскую пословицу, означающую «Знание — свет»:", options: ["Белем — нур, белмәү — хур", "Дуслык — иң зур байлык", "Эш беткәч — уйнарга ярый", "Тел — тарих көзгесе"], answer: "Белем — нур, белмәү — хур" },
  { level: "advanced", q: "Кто автор сказок «Шүрәле» и «Су анасы»?", options: ["Габдулла Тукай", "Муса Җәлил", "Каюм Насыйри", "Һади Такташ"], answer: "Габдулла Тукай" },
  { level: "advanced", q: "Что означает союз «чөнки»?", options: ["Потому что", "Хотя", "Если", "Когда"], answer: "Потому что" },
  { level: "advanced", q: "Выберите правильный перевод: «Укыган саен, белемең арта»", options: ["Чем больше читаешь, тем больше знаешь", "Кто читает, тот спит", "Чтение — это скучно", "Книга на столе"], answer: "Чем больше читаешь, тем больше знаешь" },
  { level: "advanced", q: "Что означает выражение «Бер авыздан»?", options: ["В один голос", "Одним глазом", "Одной рукой", "Тихим голосом"], answer: "В один голос" },
];

const LEVEL_BADGE: Record<ProficiencyLevel, string> = {
  beginner: "A1",
  elementary: "A2",
  intermediate: "B1",
  advanced: "B2",
};

function levelForScore(score: number): ProficiencyLevel {
  if (score >= 16) return "advanced";
  if (score >= 11) return "intermediate";
  if (score >= 6) return "elementary";
  return "beginner";
}

export function PlacementModal() {
  const { userLevel, setUserLevel, addPoints, completeTopic, profileReady } = useStore();
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [resultLevel, setResultLevel] = useState<ProficiencyLevel | null>(null);

  const current = PLACEMENT_QUESTIONS[Math.min(step, PLACEMENT_QUESTIONS.length - 1)];

  // Перемешиваем варианты ответов случайно для каждого вопроса, чтобы правильный ответ не стоял всегда первым
  const shuffledOptions = useMemo(() => {
    return [...current.options].sort(() => Math.random() - 0.5);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ждём привязку к TG-аккаунту и загрузку из БД — иначе новый аккаунт
  // на том же устройстве на миг увидит чужой тест/прогресс.
  if (!profileReady) return null;
  if (userLevel !== null) return null;

  const handleAnswer = (opt: string) => {
    haptic("medium");
    const correct = opt === current.answer;
    const newScore = correct ? score + 1 : score;
    setScore(newScore);

    if (step < PLACEMENT_QUESTIONS.length - 1) {
      setStep((s) => s + 1);
    } else {
      const lvl = levelForScore(newScore);
      const targetDiff = LEVEL_TO_DIFFICULTY[lvl];

      setResultLevel(lvl);
      setUserLevel(lvl);
      addPoints(100);

      // Нижние уровни считаем пройденными — человек стартует со своего уровня
      for (const t of TOPICS) {
        if (t.difficulty < targetDiff) completeTopic(t.slug);
      }
    }
  };

  const pct = Math.round(((step + (resultLevel ? 1 : 0)) / PLACEMENT_QUESTIONS.length) * 100);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      overflowY: "auto",
    }}>
      <div className="card animate-slide-up" style={{ width: "100%", maxWidth: 520, textAlign: "center", padding: "1.5rem", border: "2px solid var(--gold)", margin: "auto" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--gold-soft)", border: "2px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", margin: "0 auto 1rem" }}>
          🐆
        </div>
        <div className="badge badge-gold" style={{ marginBottom: 10 }}>
          <Sparkles size={12} /> Ак Барс • Входное тестирование
        </div>

        {!resultLevel ? (
          <>
            <h1 className="font-display" style={{ fontSize: "1.25rem", marginBottom: 6 }}>Определяем ваш уровень</h1>
            <p style={{ fontSize: "0.85rem", color: "var(--fg-muted)", marginBottom: 10 }}>
              Вопрос {step + 1} из {PLACEMENT_QUESTIONS.length} · сложность растёт · без теста дальше нельзя
            </p>
            <div className="progress-track" style={{ marginBottom: 12 }}>
              <div className="progress-fill progress-fill-gold" style={{ width: `${pct}%` }} />
            </div>
            <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", marginBottom: 14, flexWrap: "wrap" }}>
              <span className="badge badge-accent">{LEVEL_BADGE[current.level]} · {LEVEL_NAMES[current.level].title}</span>
              <span className="badge badge-gold">✅ {score}</span>
            </div>
            <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 20, lineHeight: 1.4 }}>
              {current.q}
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
            <h2 className="font-display" style={{ fontSize: "1.35rem", marginBottom: 8 }}>Тест успешно завершён!</h2>
            <div style={{ padding: "1rem", borderRadius: "1rem", background: "var(--surface-2)", margin: "1rem 0" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)", textTransform: "uppercase" }}>Ваш зафиксированный уровень ({score}/{PLACEMENT_QUESTIONS.length}):</div>
              <div style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--gold)", marginTop: 4 }}>
                {LEVEL_NAMES[resultLevel].title} ({LEVEL_NAMES[resultLevel].titleTt})
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--fg-muted)", marginTop: 4 }}>
                {LEVEL_NAMES[resultLevel].desc}
              </p>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--fg-muted)", marginBottom: 20 }}>
              Нижние уровни засчитаны, программа и ИИ-репетитор настроены под ваш уровень. Бонус: +100 XP 💰
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

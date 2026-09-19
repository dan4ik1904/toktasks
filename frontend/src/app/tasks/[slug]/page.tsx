"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, X, Lightbulb } from "lucide-react";
import { TOPICS } from "@/data/topics";
import { useStore } from "@/store/use-store";

export default function TopicPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { completeTask, isTaskCompleted, hearts, spendHeart } = useStore();

  const topic = TOPICS.find((t) => t.slug === slug);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [composeWords, setComposeWords] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [earned, setEarned] = useState(0);

  if (!topic) {
    return (
      <div className="page-shell" style={{ alignItems: "center", justifyContent: "center" }}>
        <p>Тема не найдена</p>
        <button className="btn btn-primary" onClick={() => router.push("/tasks")}>Назад</button>
      </div>
    );
  }

  const task = topic.tasks[currentIdx];
  const totalDone = topic.tasks.filter((t) => isTaskCompleted(t.id)).length;

  const checkAnswer = useCallback((answer: string) => {
    if (showResult) return;
    setSelected(answer);
    setShowResult(true);
    const correct = answer.toLowerCase().trim() === task.answer.toLowerCase().trim();
    setIsCorrect(correct);
    if (correct) {
      completeTask(task.id, task.reward);
      setEarned((e) => e + task.reward);
    }
  }, [showResult, task, completeTask]);

  const nextTask = () => {
    if (currentIdx < topic.tasks.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setShowResult(false);
      setIsCorrect(false);
      setShowHint(false);
    }
  };

  const renderTask = () => {
    if (!task) return null;

    if (task.type === "translate" || task.type === "grammar") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{task.question}</p>
          {task.options?.map((opt) => {
            const isSelected = selected === opt;
            const isAnswer = opt === task.answer;
            let borderColor = "var(--border)";
            if (showResult && isAnswer) borderColor = "var(--success)";
            else if (showResult && isSelected && !isCorrect) borderColor = "var(--danger)";
            else if (isSelected) borderColor = "var(--accent)";

            return (
              <button
                key={opt}
                onClick={() => checkAnswer(opt)}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  border: `2px solid ${borderColor}`,
                  background: "var(--surface)",
                  color: "var(--fg)",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: showResult ? "default" : "pointer",
                  textAlign: "left",
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      );
    }

    if (task.type === "truefalse") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{task.question}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {["true", "false"].map((opt) => {
              const label = opt === "true" ? "Верно ✓" : "Неверно ✗";
              const isSelected = selected === opt;
              const isAnswer = opt === task.answer;
              let borderColor = "var(--border)";
              if (showResult && isAnswer) borderColor = "var(--success)";
              else if (showResult && isSelected && !isCorrect) borderColor = "var(--danger)";

              return (
                <button
                  key={opt}
                  onClick={() => checkAnswer(opt)}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.75rem",
                    border: `2px solid ${borderColor}`,
                    background: "var(--surface)",
                    color: "var(--fg)",
                    fontWeight: 600,
                    cursor: showResult ? "default" : "pointer",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (task.type === "compose" && task.words) {
      const available = task.words.filter((w) => !composeWords.includes(w));
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{task.question}</p>
          <div
            style={{
              minHeight: "3rem",
              padding: "0.75rem",
              borderRadius: "0.75rem",
              border: `2px solid ${showResult ? (isCorrect ? "var(--success)" : "var(--danger)") : "var(--border)"}`,
              background: "var(--surface)",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            {composeWords.map((w) => (
              <button
                key={w}
                onClick={() => setComposeWords((cw) => cw.filter((x) => x !== w))}
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "0.5rem",
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  border: "none",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {w}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {available.map((w) => (
              <button
                key={w}
                onClick={() => setComposeWords((cw) => [...cw, w])}
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "0.5rem",
                  background: "var(--surface-2)",
                  color: "var(--fg)",
                  border: "1px solid var(--border)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {w}
              </button>
            ))}
          </div>
          {!showResult && composeWords.length > 0 && (
            <button className="btn btn-primary" onClick={() => checkAnswer(composeWords.join(" "))}>
              Проверить
            </button>
          )}
        </div>
      );
    }

    if (task.type === "listen") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
          <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{task.question}</p>
          <button
            className="btn btn-gold"
            onClick={() => {
              if ("speechSynthesis" in window) {
                const u = new SpeechSynthesisUtterance(task.answer);
                u.lang = "ru-RU";
                speechSynthesis.speak(u);
              }
            }}
          >
            🔊 Прослушать
          </button>
          <input
            type="text"
            placeholder="Напиши что услышал..."
            value={selected || ""}
            onChange={(e) => setSelected(e.target.value)}
            disabled={showResult}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.75rem",
              border: `2px solid ${showResult ? (isCorrect ? "var(--success)" : "var(--danger)") : "var(--border)"}`,
              background: "var(--surface)",
              color: "var(--fg)",
              fontSize: "0.9rem",
              textAlign: "center",
            }}
          />
          {!showResult && selected && (
            <button className="btn btn-primary" onClick={() => checkAnswer(selected)}>
              Проверить
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="page-shell">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button className="btn btn-ghost" onClick={() => router.push("/tasks")} style={{ padding: "0.5rem" }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title" style={{ fontSize: "1.2rem" }}>
            {topic.icon} {topic.title}
          </h1>
          <p className="page-subtitle">{topic.titleTt} · {totalDone}/{topic.tasks.length}</p>
        </div>
      </div>

      <div className="progress-track">
        <div className="progress-fill progress-fill-gold" style={{ width: `${(currentIdx / topic.tasks.length) * 100}%` }} />
      </div>

      <div style={{ fontSize: "0.7rem", color: "var(--fg-muted)", textAlign: "center" }}>
        Задание {currentIdx + 1} из {topic.tasks.length}
        {task && <span style={{ marginLeft: 8 }}>({task.type === "translate" ? "перевод" : task.type === "compose" ? "составь" : task.type === "truefalse" ? "верно/неверно" : task.type === "grammar" ? "грамматика" : "аудио"})</span>}
      </div>

      <div className="card">{renderTask()}</div>

      {showResult && (
        <div
          className="card animate-fade-in"
          style={{
            borderColor: isCorrect ? "var(--success)" : "var(--danger)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>
            {isCorrect ? "🎉" : "😔"}
          </div>
          <div style={{ fontWeight: 700, color: isCorrect ? "var(--success)" : "var(--danger)" }}>
            {isCorrect ? `Правильно! +${task.reward} 💰` : `Неверно. Ответ: ${task.answer}`}
          </div>
          {!isCorrect && !showHint && (
            <button
              className="btn btn-ghost"
              onClick={() => setShowHint(true)}
              style={{ marginTop: 8, fontSize: "0.75rem" }}
            >
              <Lightbulb size={14} /> Подсказка кота
            </button>
          )}
          {showHint && (
            <p style={{ fontSize: "0.8rem", color: "var(--fg-muted)", marginTop: 4 }}>
              🐱 Попробуй вспомнить корни слов и повтори ещё раз!
            </p>
          )}
          <button className="btn btn-primary" onClick={nextTask} style={{ marginTop: 12 }}>
            {currentIdx < topic.tasks.length - 1 ? "Следующее задание" : "Завершить тему"}
          </button>
        </div>
      )}

      {currentIdx >= topic.tasks.length - 1 && showResult && isCorrect && (
        <div className="card card-gold animate-slide-up" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem" }}>🏆</div>
          <div style={{ fontWeight: 700 }}>Тема завершена!</div>
          <div style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>Заработано: {earned} поинтов</div>
          <button className="btn btn-gold" onClick={() => router.push("/tasks")} style={{ marginTop: 8 }}>
            К списку тем
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { TOPICS } from "@/data/topics";
import { useStore } from "@/store/use-store";

export default function TopicPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { completeTask, completeTopic, isTaskCompleted } = useStore();

  const topic = TOPICS.find((t) => t.slug === slug);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [composeWords, setComposeWords] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [earned, setEarned] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [speakScore, setSpeakScore] = useState<number | null>(null);
  const [speakHint, setSpeakHint] = useState("");
  const [isSpeakChecking, setIsSpeakChecking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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

  // Перемешанные слова для заданий типа compose (в разброс)
  const shuffledWords = useMemo(() => {
    if (!task || task.type !== "compose" || !task.words) return [];
    return [...task.words].sort(() => Math.random() - 0.5);
  }, [currentIdx, task]);

  const checkAnswer = useCallback((answer: string) => {
    if (showResult) return;
    setSelected(answer);
    setShowResult(true);
    const correct = answer.toLowerCase().trim() === task.answer.toLowerCase().trim();
    setIsCorrect(correct);
    if (correct) {
      completeTask(task.id, task.reward);
      setEarned((e) => e + task.reward);
      if (currentIdx === topic.tasks.length - 1) {
        completeTopic(topic.slug);
      }
    }
  }, [showResult, task, completeTask, completeTopic, currentIdx, topic]);

  const nextTask = () => {
    if (currentIdx < topic.tasks.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setShowResult(false);
      setIsCorrect(false);
      setShowHint(false);
      setComposeWords([]);
      setSpeakScore(null);
      setSpeakHint("");
    } else {
      completeTopic(topic.slug);
      router.push("/tasks");
    }
  };

  const handleBack = () => {
    if (confirm("Выйти из урока? Весь текущий прогресс будет потерян.")) {
      router.push("/tasks");
    }
  };

  // Контекстные подсказки Ак Барса в зависимости от типа задания и вопроса
  const getContextualHint = () => {
    if (!task) return "Попробуй внимательно прочитать вопрос и выбрать правильный вариант.";
    if (task.type === "translate") {
      return `💡 Подсказка: В татарском языке слово «${task.question.replace(/Как будет | по-татарски\?/g, '')}» имеет прямое соответствие в словаре темы. Обрати внимание на написание специфических букв (ә, ө, ү, җ, ң, һ).`;
    }
    if (task.type === "grammar") {
      return `💡 Подсказка по грамматике: В этом предложении важно правильно подобрать аффикс (окончание) в зависимости от гармонии гласных (закон сингармонизма).`;
    }
    if (task.type === "compose") {
      return `💡 Подсказка: В татарском предложении подлежащее обычно стоит в начале, а сказуемое (глагол) — в самом конце.`;
    }
    if (task.type === "truefalse") {
      return `💡 Подсказка: Вспомни правила и факты, изучаемые в этой теме, и оцени утверждение.`;
    }
    return `💡 Подсказка: Проверь написание и повтори правила татарской фонетики.`;
  };

  const handleSpeakRecord = useCallback(async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        setIsSpeakChecking(true);

        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        try {
          const reader = new FileReader();
          reader.onload = async () => {
            const audioBase64 = (reader.result as string).split(",")[1];
            const res = await fetch(base + "/api/task/speak", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                expected: task?.answer || "",
                audio_base64: audioBase64,
                heard: "",
              }),
            });
            const data = await res.json();
            setSpeakScore(data.score || 0);
            setSpeakHint(data.hint_ru || data.hint_tt || "");
            if (data.correct) {
              setIsCorrect(true);
              setShowResult(true);
              completeTask(task!.id, task!.reward);
              setEarned((e) => e + task!.reward);
            } else {
              setIsCorrect(false);
              setShowResult(true);
            }
            setIsSpeakChecking(false);
          };
          reader.readAsDataURL(blob);
        } catch {
          setIsSpeakChecking(false);
          setSpeakHint("Ошибка соединения с сервером");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setSpeakHint("Микрофон недоступен");
    }
  }, [isRecording, task, completeTask]);

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
      const available = shuffledWords.filter((w) => !composeWords.includes(w));
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{task.question}</p>
          <div
            style={{
              minHeight: "3rem",
              padding: "0.75rem",
              borderRadius: "0.75rem",
              border: `2px solid ${showResult ? (isCorrect ? "var(--success)" : "var(--danger)") : "var(--border"}`,
              background: "var(--surface)",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            {composeWords.map((w, idx) => (
              <button
                key={idx}
                onClick={() => setComposeWords((cw) => cw.filter((_, i) => i !== idx))}
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
            {available.map((w, idx) => (
              <button
                key={idx}
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
              border: `2px solid ${showResult ? (isCorrect ? "var(--success)" : "var(--danger)") : "var(--border"}`,
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

    if (task.type === "speak") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
          <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>{task.question}</p>
          {task.speakText && (
            <div style={{
              padding: "0.75rem 1rem", borderRadius: "0.75rem", background: "var(--surface-2)",
              fontSize: "1.1rem", fontWeight: 600, color: "var(--gold)", textAlign: "center",
            }}>
              «{task.speakText}»
            </div>
          )}
          <button
            className={"btn " + (isRecording ? "btn-danger" : "btn-gold")}
            onClick={handleSpeakRecord}
            disabled={isSpeakChecking || showResult}
            style={{ padding: "0.75rem 1.5rem", fontSize: "1rem" }}
          >
            {isRecording ? "⏹ Остановить" : isSpeakChecking ? "🤔 Проверяю..." : "🎤 Произнести"}
          </button>
          {speakScore !== null && (
            <div style={{ textAlign: "center", width: "100%" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>Точность: {speakScore}%</div>
              {speakHint && (
                <div style={{ fontSize: "0.8rem", color: "var(--fg-muted)", marginTop: 4 }}>
                  🐆 {speakHint}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="page-shell">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button className="btn btn-ghost" onClick={handleBack} style={{ padding: "0.5rem" }}>
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
              <Lightbulb size={14} /> Подсказка Ак Барса
            </button>
          )}
          {showHint && (
            <p style={{ fontSize: "0.8rem", color: "var(--fg-muted)", marginTop: 4, lineHeight: 1.4 }}>
              🐆 {getContextualHint()}
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
          <button className="btn btn-gold" onClick={() => { completeTopic(topic.slug); router.push("/tasks"); }} style={{ marginTop: 8 }}>
            К списку тем
          </button>
        </div>
      )}
    </div>
  );
}

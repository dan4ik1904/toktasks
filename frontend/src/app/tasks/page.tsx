"use client";

import Link from "next/link";
import { TOPICS } from "@/data/topics";
import { useStore } from "@/store/use-store";
import { useLang } from "@/store/use-lang";
import { LEVEL_NAMES, LEVEL_TO_DIFFICULTY, LEVEL_ORDER } from "@/components/placement-modal";
import { haptic } from "@/lib/telegram";
import { Lock } from "lucide-react";

const LEVEL_BADGE: Record<string, string> = {
  beginner: "A1",
  elementary: "A2",
  intermediate: "B1",
  advanced: "B2",
};

export default function TasksPage() {
  const { completedTasks, completedTopics, userLevel } = useStore();
  const { t } = useLang();

  const userDiff = userLevel ? LEVEL_TO_DIFFICULTY[userLevel] : 1;

  // Прогрессия: следующий уровень открывается, когда закрыт текущий
  let unlockedLevel = userDiff;
  for (let d = userDiff; d <= 4; d++) {
    const levelTopics = TOPICS.filter((topic) => topic.difficulty === d);
    const allDone = levelTopics.length > 0 && levelTopics.every((topic) => completedTopics.includes(topic.slug));
    if (allDone && unlockedLevel < 4) unlockedLevel = d + 1;
    else if (!allDone) break;
  }

  return (
    <div className="page-shell" style={{ alignItems: "center" }}>
      <div style={{ width: "100%" }}>
        <h1 className="page-title">{t("lessonsTitle")}</h1>
        <p className="page-subtitle">{t("lessonsSubtitle")}</p>
      </div>

      {userLevel && (
        <div className="card card-gold" style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ fontSize: "1.8rem" }}>🐆</div>
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--fg-muted)", textTransform: "uppercase" }}>Ваш уровень по тесту</div>
            <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>
              {LEVEL_BADGE[userLevel]} · {LEVEL_NAMES[userLevel].title} ({LEVEL_NAMES[userLevel].titleTt})
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>
              Открыт уровень {unlockedLevel} из 4 · следующий откроется после закрытия текущего
            </div>
          </div>
        </div>
      )}

      {/* Древо уроков по 4 уровням */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%", padding: "0.5rem 0 1rem" }}>
        {LEVEL_ORDER.map((lvl) => {
          const diff = LEVEL_TO_DIFFICULTY[lvl];
          const topics = TOPICS.filter((topic) => topic.difficulty === diff);
          const locked = diff > unlockedLevel;
          return (
            <div key={lvl} style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
              <div className="card" style={{ display: "flex", alignItems: "center", gap: "0.6rem", opacity: locked ? 0.75 : 1 }}>
                <span className={locked ? "badge badge-red" : diff === unlockedLevel ? "badge badge-gold" : "badge badge-accent"}>
                  {locked ? <Lock size={11} /> : null} Уровень {diff} · {LEVEL_BADGE[lvl]}
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.85rem" }}>{LEVEL_NAMES[lvl].title} ({LEVEL_NAMES[lvl].titleTt})</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--fg-muted)" }}>
                    {locked ? "Откроется после закрытия предыдущего уровня" : LEVEL_NAMES[lvl].desc}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", width: "100%" }}>
                {topics.map((topic, index) => {
                  const done = topic.tasks.filter((task) => completedTasks.includes(task.id)).length;
                  const total = topic.tasks.length;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  const isCompleted = completedTopics.includes(topic.slug);

                  const offsets = ["0px", "35px", "0px", "-35px"];
                  const alignOffset = offsets[index % offsets.length];

                  if (locked) {
                    return (
                      <div key={topic.slug} style={{ transform: `translateX(${alignOffset})`, display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.55 }}>
                        <div style={{
                          width: "86px", height: "86px", borderRadius: "50%", background: "var(--surface-2)",
                          border: "4px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "2rem",
                        }}>
                          🔒
                        </div>
                        <div className="card" style={{ marginTop: 8, textAlign: "center", minWidth: 160, padding: "0.5rem 0.75rem" }}>
                          <div style={{ fontWeight: 800, fontSize: "0.8rem", color: "var(--fg)" }}>{topic.title}</div>
                          <div style={{ fontSize: "0.65rem", color: "var(--fg-muted)" }}>{topic.titleTt}</div>
                          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)", marginTop: 4 }}>Закрыто · уровень {diff}</div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={topic.slug} style={{ transform: `translateX(${alignOffset})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Link
                        href={`/tasks/${topic.slug}`}
                        onClick={() => haptic("medium")}
                        style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}
                      >
                        <div
                          style={{
                            width: "86px",
                            height: "86px",
                            borderRadius: "50%",
                            background: isCompleted
                              ? "linear-gradient(135deg, var(--gold), var(--gold-light))"
                              : pct > 0
                              ? "linear-gradient(135deg, var(--accent-deep), var(--accent))"
                              : "var(--surface-2)",
                            border: "4px solid var(--border)",
                            boxShadow: isCompleted ? "var(--glow-gold)" : pct > 0 ? "var(--glow-accent)" : "var(--card-shadow)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "2.2rem",
                            transition: "transform 0.2s ease",
                          }}
                          className="card-lift"
                        >
                          {isCompleted ? "👑" : topic.icon}
                        </div>

                        <div className="card" style={{ marginTop: 8, textAlign: "center", minWidth: 160, padding: "0.5rem 0.75rem" }}>
                          <div style={{ fontWeight: 800, fontSize: "0.8rem", color: "var(--fg)" }}>{topic.title}</div>
                          <div style={{ fontSize: "0.65rem", color: "var(--fg-muted)" }}>{topic.titleTt}</div>
                          <div className="progress-track" style={{ marginTop: 6, height: 4 }}>
                            <div className="progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6rem", color: "var(--fg-muted)", marginTop: 4 }}>
                            <span>{done}/{total}</span>
                            <span style={{ color: "var(--gold)", fontWeight: 700 }}>+{topic.reward} 💰</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

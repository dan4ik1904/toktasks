"use client";

import Link from "next/link";
import { TOPICS } from "@/data/topics";
import { useStore } from "@/store/use-store";
import { haptic } from "@/lib/telegram";
import { Sparkles, Trophy } from "lucide-react";

function Stars({ n }: { n: number }) {
  return (
    <span className="stars">
      {Array.from({ length: 3 }).map((_, i) => (
        <span key={i} className={i < n ? "star-on" : "star-off"}>★</span>
      ))}
    </span>
  );
}

export default function TasksPage() {
  const { completedTasks, completedTopics, points } = useStore();

  return (
    <div className="page-shell" style={{ alignItems: "center" }}>
      <div style={{ width: "100%", display: "flex", justifyContent: "between", alignItems: "center" }}>
        <div>
          <div className="badge badge-accent" style={{ marginBottom: 6 }}>
            <Sparkles size={11} /> Древо знаний • Duolingo Style
          </div>
          <h1 className="page-title">Уроки татарского</h1>
          <p className="page-subtitle">Проходите уровни последовательно для лучших результатов</p>
        </div>
        <div className="badge badge-gold">💰 {points}</div>
      </div>

      {/* Древо уроков: зигзагообразная сетка в стиле Duolingo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", width: "100%", padding: "1rem 0" }}>
        {TOPICS.map((topic, index) => {
          const done = topic.tasks.filter((t) => completedTasks.includes(t.id)).length;
          const total = topic.tasks.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const isCompleted = completedTopics.includes(topic.slug);

          // Зигзагообразное смещение для дуолинго-стиля дерева
          const offsets = ["0px", "35px", "0px", "-35px"];
          const alignOffset = offsets[index % offsets.length];

          return (
            <div key={topic.slug} style={{ transform: `translateX(${alignOffset})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Link
                href={`/tasks/${topic.slug}`}
                onClick={() => haptic("medium")}
                style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}
              >
                {/* Круглая кнопка урока */}
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

                {/* Название и прогресс */}
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
}

"use client";

import Link from "next/link";
import { TOPICS } from "@/data/topics";
import { useStore } from "@/store/use-store";

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
    <div className="page-shell">
      <div>
        <h1 className="page-title">Задания</h1>
        <p className="page-subtitle">Учи татарский по темам</p>
      </div>

      <div className="badge badge-gold" style={{ alignSelf: "flex-start" }}>
        💰 {points} поинтов
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {TOPICS.map((topic) => {
          const done = topic.tasks.filter((t) => completedTasks.includes(t.id)).length;
          const total = topic.tasks.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const isCompleted = completedTopics.includes(topic.slug);

          return (
            <Link key={topic.slug} href={`/tasks/${topic.slug}`} style={{ textDecoration: "none" }}>
              <div className={`card ${isCompleted ? "card-gold" : ""}`} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ fontSize: "2rem", width: 48, textAlign: "center" }}>{topic.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--fg)" }}>{topic.title}</span>
                    <Stars n={topic.difficulty} />
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--fg-muted)", marginTop: 2 }}>{topic.titleTt}</div>
                  <div className="progress-track" style={{ marginTop: 8 }}>
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: "0.65rem", color: "var(--fg-muted)" }}>
                    <span>{done}/{total} заданий</span>
                    <span style={{ color: "var(--gold)", fontWeight: 600 }}>+{topic.reward} 💰</span>
                  </div>
                </div>
                {isCompleted && <span style={{ color: "var(--gold)", fontSize: "1.2rem" }}>✓</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

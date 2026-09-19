"use client";

import { useStore } from "@/store/use-store";

// ============================================================
// Первый запуск: выбор пола тамагочи — Малай или Кыз.
// Влияет на внешность (бантик) и подбор одежды.
// ============================================================

export function GenderModal() {
  const { gender, setGender } = useStore();

  if (gender !== null) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-sheet animate-pop" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2.4rem" }}>🐱</div>
        <h2 className="page-title" style={{ marginTop: 6 }}>Кто твой кот?</h2>
        <p className="page-subtitle" style={{ marginTop: 4 }}>
          Выбери — от этого зависит внешность и наряды
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginTop: 12 }}>
          <button className="card card-lift card-accent" onClick={() => setGender("malai")} style={{ cursor: "pointer", padding: "1.1rem 0.5rem" }}>
            <div style={{ fontSize: "2.2rem" }}>🧢</div>
            <div style={{ fontWeight: 800, marginTop: 6 }}>Малай</div>
            <div style={{ fontSize: "0.7rem", color: "var(--fg-muted)" }}>мальчик</div>
          </button>
          <button className="card card-lift card-gold" onClick={() => setGender("kyz")} style={{ cursor: "pointer", padding: "1.1rem 0.5rem" }}>
            <div style={{ fontSize: "2.2rem" }}>🎀</div>
            <div style={{ fontWeight: 800, marginTop: 6 }}>Кыз</div>
            <div style={{ fontSize: "0.7rem", color: "var(--fg-muted)" }}>девочка</div>
          </button>
        </div>
      </div>
    </div>
  );
}

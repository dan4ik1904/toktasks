"use client";

import { Keyboard } from "lucide-react";
import { haptic } from "@/lib/telegram";

/** Один раз просит ученика добавить татарскую раскладку (нужна для «прослушай и напиши»). */
export function TatarKeyboardModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet animate-pop" onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--gold-soft)", border: "2px solid var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem" }}>
          <Keyboard size={26} style={{ color: "var(--gold)" }} />
        </div>
        <h2 className="font-display" style={{ fontSize: "1.05rem", marginBottom: 6 }}>Добавь татарскую клавиатуру</h2>
        <p style={{ fontSize: "0.82rem", color: "var(--fg-muted)", lineHeight: 1.5 }}>
          В заданиях «прослушай и напиши» нужны буквы <b style={{ color: "var(--fg)" }}>ә, ө, ү, җ, ң, һ</b> —
          добавь раскладку один раз в настройках телефона:
        </p>
        <div style={{ textAlign: "left", fontSize: "0.8rem", lineHeight: 1.55, marginTop: 10, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div className="card" style={{ padding: "0.6rem 0.8rem" }}>
            <b>🍏 iPhone:</b> Настройки → Основные → Клавиатура → Клавиатуры → Добавить → <b>Татарча</b>
          </div>
          <div className="card" style={{ padding: "0.6rem 0.8rem" }}>
            <b>🤖 Android (Gboard):</b> Настройки → Языки → Добавить язык → <b>Татарча</b>
          </div>
        </div>
        <button
          className="btn btn-gold"
          onClick={() => { haptic("medium"); onClose(); }}
          style={{ width: "100%", marginTop: 12 }}
        >
          Понятно
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { X, QrCode, BadgePercent } from "lucide-react";
import { useStore } from "@/store/use-store";

// ============================================================
// Партнёр «Тюбетей» (сеть ресторанов татарской кухни).
// MVP: UI-заглушка — обмен баллов на скидку, QR-код для кассы.
// Формула ТЗ: 1000 = 10%, 2500 = 20%, 5000 = бесплатный эчпочмак.
// Реальной интеграции нет — QR псевдо-код для демо.
// ============================================================

interface Tier {
  id: string;
  cost: number;
  title: string;
  icon: string;
}

const TIERS: Tier[] = [
  { id: "tube-10", cost: 1000, title: "Скидка 10% в «Тюбетее»", icon: "🎟" },
  { id: "tube-20", cost: 2500, title: "Скидка 20% в «Тюбетее»", icon: "🎫" },
  { id: "tube-free", cost: 5000, title: "Бесплатный эчпочмак", icon: "🔺" },
];

// Псевдо-QR: детерминированная сетка 21×21 из кода (для демо-витрины)
function PseudoQr({ code }: { code: string }) {
  const N = 21;
  let seed = 0;
  for (const ch of code) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const cells: boolean[] = [];
  for (let i = 0; i < N * N; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    cells.push(seed % 100 < 46);
  }
  // три уголка-метки как у настоящего QR
  const inFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
  const cell = 8;
  return (
    <svg width={N * cell} height={N * cell} viewBox={`0 0 ${N * cell} ${N * cell}`} style={{ borderRadius: 12, background: "#fff", padding: 8 }}>
      {cells.map((on, i) => {
        const r = Math.floor(i / N);
        const c = i % N;
        if (inFinder(r, c)) {
          const fr = r % 7;
          const fc = c % 7;
          const finderOn = fr === 0 || fr === 6 || fc === 0 || fc === 6 || (fr >= 2 && fr <= 4 && fc >= 2 && fc <= 4);
          if (!finderOn) return null;
          return <rect key={i} x={c * cell} y={r * cell} width={cell} height={cell} fill="#101c15" />;
        }
        if (!on) return null;
        return <rect key={i} x={c * cell} y={r * cell} width={cell} height={cell} fill="#101c15" />;
      })}
    </svg>
  );
}

export function PartnerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { points, spendPoints, name } = useStore();
  const [qrFor, setQrFor] = useState<Tier | null>(null);
  const [qrCode, setQrCode] = useState("");

  const exchange = (tier: Tier) => {
    if (!spendPoints(tier.cost)) return;
    // демо-код для кассы: тир + баллы + имя
    const code = `TUBETEI-${tier.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${name.slice(0, 8)}`;
    setQrCode(code);
    setQrFor(tier);
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {qrFor ? (
          // Экран QR-кода для кассы
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem" }}>{qrFor.icon}</div>
            <div style={{ fontWeight: 800, marginTop: 4 }}>{qrFor.title}</div>
            <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginTop: 4 }}>
              Покажи этот код на кассе «Тюбетея»
            </p>
            <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
              <PseudoQr code={qrCode} />
            </div>
            <div className="badge badge-gold" style={{ fontSize: "0.7rem" }}>{qrCode}</div>
            <p style={{ fontSize: "0.68rem", color: "var(--fg-muted)", marginTop: 8 }}>
              Демо-режим: код не настоящий, интеграция с кассой не подключена
            </p>
            <button className="btn btn-ghost" onClick={() => setQrFor(null)} style={{ marginTop: 10, width: "100%" }}>
              Назад к скидкам
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: 10 }}>
              <span style={{ fontSize: "1.6rem" }}>🍲</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>Тюбетей • партнёр</div>
                <div style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>меняй баллы на скидки</div>
              </div>
              <span className="badge badge-gold">💰 {points}</span>
              <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Закрыть">
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {TIERS.map((t) => {
                const afford = points >= t.cost;
                return (
                  <div key={t.id} className="card" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "1.6rem" }}>{t.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{t.title}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--fg-muted)" }}>{t.cost} баллов</div>
                    </div>
                    <button
                      className={"btn btn-sm " + (afford ? "btn-gold" : "btn-ghost")}
                      disabled={!afford}
                      onClick={() => exchange(t)}
                    >
                      <QrCode size={14} /> {t.cost} 💰
                    </button>
                  </div>
                );
              })}
            </div>

            <p style={{ fontSize: "0.7rem", color: "var(--fg-muted)", marginTop: 10, display: "flex", gap: 6, alignItems: "center" }}>
              <BadgePercent size={14} /> Баллы списываются сразу, QR действует 24 часа (демо).
            </p>
          </>
        )}
      </div>
    </div>
  );
}

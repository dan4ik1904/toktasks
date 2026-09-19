"use client";

import { useState } from "react";
import { useStore, petRank } from "@/store/use-store";
import { useTheme } from "@/providers/theme-provider";
import { Cat, Star, Zap, Flame, Trophy, RotateCcw, Sun, Moon, QrCode } from "lucide-react";
import { OUTFITS } from "@/games/catalog";
import { PartnerModal } from "@/components/partner-modal";

const SHOP_ITEMS = [
  { id: "merch-tshirt", title: "Футболка TATARCHA", desc: "Мерч от команды", price: 300, category: "merch" },
  { id: "cafe-discount", title: "Скидка 15% в кафе «Бәлеш»", desc: "Казань, ул. Баумана", price: 150, category: "discounts" },
  { id: "museum-ticket", title: "Билет в Национальный музей", desc: "Республика Татарстан", price: 500, category: "tickets" },
  { id: "sticker-pack", title: "Стикерпак с котом", desc: "Telegram стикеры", price: 50, category: "merch" },
  { id: "blesh-cake", title: "Бәлеш на выбор", desc: "Кафе «Бәлеш», Казань", price: 200, category: "food" },
  { id: "tatarcha-pen", title: "Ручка TATARCHA", desc: "Мерч", price: 80, category: "merch" },
];

export default function ProfilePage() {
  const { name, setName, points, streak, hearts, cat, gender, setGender, gamesPlayed, dressCat, completedTasks, completedTopics, achievements, shopPurchases, spendPoints, buyShopItem, reset } = useStore();
  const { theme, toggleTheme } = useTheme();
  const [partnerOpen, setPartnerOpen] = useState(false);
  const level = Math.min(50, Math.floor(points / 100) + 1);
  const xpInLevel = points % 100;
  const rank = petRank(points, gamesPlayed);
  const unlockedAchievements = achievements.filter((a) => a.unlocked);

  return (
    <div className="page-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="page-title">Профиль</h1>
        <button className="btn btn-ghost" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* User card */}
      <div className="card card-gold" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 800, fontSize: "1.3rem",
          border: "3px solid var(--gold)",
        }}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <input value={name} onChange={(e) => setName(e.target.value)}
            style={{ background: "transparent", border: "none", color: "var(--fg)", fontWeight: 700, fontSize: "1rem", width: "100%", padding: 0 }} />
          <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>Уровень {level}</div>
          <div className="progress-track" style={{ marginTop: 4 }}>
            <div className="progress-fill progress-fill-gold" style={{ width: xpInLevel + "%" }} />
          </div>
          {/* Ранг питомца и пол */}
          <div style={{ display: "flex", gap: "0.4rem", marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span className="badge badge-gold">🐱 {rank.name} ({gamesPlayed} игр)</span>
            <span className="badge badge-accent">{gender === "kyz" ? "Кыз 🎀" : gender === "malai" ? "Малай 🧢" : "Пол не выбран"}</span>
            <button className="btn btn-sm btn-ghost" onClick={() => setGender(gender === "kyz" ? "malai" : "kyz")}>
              Сменить: {gender === "kyz" ? "Малай" : "Кыз"}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.5rem" }}>
        <div className="card" style={{ textAlign: "center", padding: "0.75rem 0.25rem" }}>
          <Zap size={16} style={{ color: "var(--gold)" }} />
          <div style={{ fontWeight: 800, fontSize: "1rem" }}>{points}</div>
          <div style={{ fontSize: "0.6rem", color: "var(--fg-muted)" }}>Поинты</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "0.75rem 0.25rem" }}>
          <Flame size={16} style={{ color: "#E74C3C" }} />
          <div style={{ fontWeight: 800, fontSize: "1rem" }}>{streak}</div>
          <div style={{ fontSize: "0.6rem", color: "var(--fg-muted)" }}>Серия</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "0.75rem 0.25rem" }}>
          <Cat size={16} style={{ color: "var(--gold)" }} />
          <div style={{ fontWeight: 800, fontSize: "1rem" }}>{cat.level}</div>
          <div style={{ fontSize: "0.6rem", color: "var(--fg-muted)" }}>Кот ур.</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "0.75rem 0.25rem" }}>
          <Trophy size={16} style={{ color: "var(--accent)" }} />
          <div style={{ fontWeight: 800, fontSize: "1rem" }}>{completedTasks.length}</div>
          <div style={{ fontSize: "0.6rem", color: "var(--fg-muted)" }}>Заданий</div>
        </div>
      </div>

      {/* Achievements */}
      {unlockedAchievements.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 8 }}>Достижения ({unlockedAchievements.length})</div>
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: 4 }}>
            {unlockedAchievements.map((a) => (
              <div key={a.id} className="card card-gold" style={{ minWidth: 100, textAlign: "center", padding: "0.5rem" }}>
                <div style={{ fontSize: "1.3rem" }}>{a.icon}</div>
                <div style={{ fontSize: "0.6rem", fontWeight: 600 }}>{a.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shop */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>👕 Кибет — одежда кота</span>
          <span className="badge badge-gold">💰 {points}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {OUTFITS.filter((o) => o.price > 0).map((item) => {
            const bought = shopPurchases.includes(item.id);
            const worn = cat.outfit === item.id;
            return (
              <div key={item.id} className="card" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.6rem" }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{item.name}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--fg-muted)" }}>{item.nameTt}</div>
                </div>
                {worn ? (
                  <span className="badge badge-gold">Надето ✓</span>
                ) : bought ? (
                  <button className="btn btn-sm btn-primary" onClick={() => dressCat(item.id)}>
                    Надеть
                  </button>
                ) : (
                  <button
                    className={"btn btn-sm " + (points >= item.price ? "btn-gold" : "btn-ghost")}
                    disabled={points < item.price}
                    onClick={() => { if (spendPoints(item.price)) buyShopItem(item.id); }}>
                    {item.price} 💰
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Партнёр Тюбетей */}
      <button className="card card-lift card-gold" onClick={() => setPartnerOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", width: "100%", textAlign: "left" }}>
        <span style={{ fontSize: "1.8rem" }}>🍲</span>
        <span style={{ flex: 1 }}>
          <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--fg)", display: "block" }}>Тюбетей • скидки за баллы</span>
          <span style={{ fontSize: "0.7rem", color: "var(--fg-muted)" }}>показать QR на кассе</span>
        </span>
        <QrCode size={20} style={{ color: "var(--gold)" }} />
      </button>
      <PartnerModal open={partnerOpen} onClose={() => setPartnerOpen(false)} />

      {/* Shop */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>🛍 Магазин</span>
          <span className="badge badge-gold">💰 {points}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {SHOP_ITEMS.map((item) => {
            const bought = shopPurchases.includes(item.id);
            return (
              <div key={item.id} className="card" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{item.title}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--fg-muted)" }}>{item.desc}</div>
                </div>
                {bought ? (
                  <span className="badge badge-accent">Куплено ✓</span>
                ) : (
                  <button
                    className={"btn btn-sm " + (points >= item.price ? "btn-gold" : "btn-ghost")}
                    disabled={points < item.price}
                    onClick={() => { if (spendPoints(item.price)) buyShopItem(item.id); }}>
                    {item.price} 💰
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset */}
      <button className="btn btn-ghost" onClick={() => { if (confirm("Сбросить весь прогресс?")) reset(); }}
        style={{ color: "var(--danger)", fontSize: "0.75rem" }}>
        <RotateCcw size={14} /> Сбросить прогресс
      </button>
    </div>
  );
}

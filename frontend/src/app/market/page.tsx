"use client";

import { useState } from "react";
import { useStore } from "@/store/use-store";
import { ShoppingBag, Tag, QrCode, Sparkles, Check } from "lucide-react";
import { PartnerModal } from "@/components/partner-modal";
import { haptic } from "@/lib/telegram";

const MARKET_ITEMS = [
  { id: "tyubetey-10", title: "Скидка 10% в ресторане «Тюбетей»", desc: "Действует во всех точках Казани", price: 1000, icon: "🍲", tag: "Скидка" },
  { id: "tyubetey-20", title: "Скидка 20% в ресторане «Тюбетей»", desc: "Эксклюзивный промокод на заказ", price: 2500, icon: "🍲", tag: "Скидка" },
  { id: "free-echpochmak", title: "Бесплатный горячий эчпочмак", desc: "Подарок от шеф-повара в «Тюбетей»", price: 5000, icon: "🥟", tag: "Подарок" },
  { id: "merch-tshirt", title: "Фирменная футболка TATARCHA", desc: "Стильный мерч с татарским орнаментом", price: 3000, icon: "👕", tag: "Мерч" },
  { id: "sticker-pack", title: "Стикерпак с котом и фразами", desc: "Telegram стикеры для общения", price: 150, icon: "🐱", tag: "Цифровое" },
  { id: "museum-ticket", title: "Билет в Национальный музей РТ", desc: "Бесплатный вход на выставку", price: 1200, icon: "🏛️", tag: "Культура" },
];

export default function MarketPage() {
  const { points, spendPoints, shopPurchases, buyShopItem } = useStore();
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleBuy = (item: typeof MARKET_ITEMS[0]) => {
    haptic("medium");
    if (shopPurchases.includes(item.id)) return;
    if (spendPoints(item.price)) {
      buyShopItem(item.id);
      setToast(`Успешно получено: ${item.title}!`);
      setTimeout(() => setToast(null), 3000);
    } else {
      setToast("Не хватает баллов XP!");
      setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <div className="page-shell">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="badge badge-gold" style={{ marginBottom: 4 }}>
            <Sparkles size={11} /> Маркет наград
          </div>
          <h1 className="page-title">Скидки и мерч</h1>
          <p className="page-subtitle">Обменивай заработанные XP на купоны, акции и подарки</p>
        </div>
        <div className="badge badge-gold">💰 {points} XP</div>
      </div>

      {/* Быстрая кнопка Тюбетей QR */}
      <button className="card card-lift card-gold" onClick={() => { haptic("medium"); setPartnerOpen(true); }} style={{ display: "flex", alignItems: "center", gap: "0.85rem", cursor: "pointer", width: "100%", textAlign: "left" }}>
        <span style={{ fontSize: "2rem" }}>🍲</span>
        <span style={{ flex: 1 }}>
          <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--fg)", display: "block" }}>Партнерская программа «Тюбетей»</span>
          <span style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>Открыть кассовый QR-код для скидки</span>
        </span>
        <QrCode size={22} style={{ color: "var(--gold)" }} />
      </button>
      <PartnerModal open={partnerOpen} onClose={() => setPartnerOpen(false)} />

      {/* Список товаров / купонов */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: 4 }}>
        <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>Доступные акции и товары</div>
        {MARKET_ITEMS.map((item) => {
          const owned = shopPurchases.includes(item.id);
          const afford = points >= item.price;

          return (
            <div key={item.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ fontSize: "2.2rem", width: 48, textAlign: "center" }}>{item.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>{item.title}</span>
                  <span className="badge badge-accent" style={{ fontSize: "0.58rem" }}>{item.tag}</span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--fg-muted)", marginTop: 2 }}>{item.desc}</div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gold)", marginTop: 4 }}>{item.price} 💰 XP</div>
              </div>
              {owned ? (
                <div className="badge badge-gold" style={{ display: "flex", gap: 4 }}>
                  <Check size={14} /> Получено
                </div>
              ) : (
                <button
                  className={"btn btn-sm " + (afford ? "btn-gold" : "btn-ghost")}
                  disabled={!afford}
                  onClick={() => handleBuy(item)}
                >
                  Забрать
                </button>
              )}
            </div>
          );
        })}
      </div>

      {toast && (
        <div className="animate-pop" style={{
          position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: "var(--gold)", color: "#1a1405", fontWeight: 800, fontSize: "0.85rem",
          padding: "0.6rem 1.1rem", borderRadius: "999px", boxShadow: "var(--glow-gold)", zIndex: 60,
          display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
        }}>
          <ShoppingBag size={14} /> {toast}
        </div>
      )}
    </div>
  );
}

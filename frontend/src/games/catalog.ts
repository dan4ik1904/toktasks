// ============================================================
// Единый каталог Ашханы и Кибета по ТЗ — один источник для
// страницы кота и профиля (цены и эффект в одном месте).
// ============================================================

export interface Food {
  id: string;
  name: string;
  nameTt: string;
  icon: string;
  /** цена в баллах */
  price: number;
  /** +сытности, % */
  satiety: number;
}

export const FOODS: Food[] = [
  { id: "chai", name: "Чай", nameTt: "Чәй", icon: "🍵", price: 10, satiety: 10 },
  { id: "ipi", name: "Хлеб", nameTt: "Ипи", icon: "🍞", price: 15, satiety: 15 },
  { id: "ochpochmak", name: "Өчпочмак", nameTt: "Өчпочмак", icon: "🔺", price: 30, satiety: 30 },
  { id: "gubadia", name: "Губадия", nameTt: "Гөбәдия", icon: "🥧", price: 40, satiety: 40 },
  { id: "belesh", name: "Бэлеш", nameTt: "Бәлеш", icon: "🍲", price: 50, satiety: 50 },
];

export interface Outfit {
  id: string;
  name: string;
  nameTt: string;
  icon: string;
  /** цена в баллах (0 — выдано со старта) */
  price: number;
}

export const OUTFITS: Outfit[] = [
  { id: "default", name: "Простая тюбетейка", nameTt: "Түбәтәй", icon: "🧢", price: 0 },
  { id: "tubeteika-gold", name: "Золотая тюбетейка", nameTt: "Алтын түбәтәй", icon: "👑", price: 200 },
  { id: "platok", name: "Платок", nameTt: "Яулык", icon: "🧣", price: 250 },
  { id: "ichigi", name: "Ичиги (сапоги)", nameTt: "Читек", icon: "🥾", price: 300 },
  { id: "hair", name: "Розовая шёрстка", nameTt: "Ал чәч", icon: "💈", price: 150 },
  { id: "kamzol", name: "Камзол", nameTt: "Камзул", icon: "🥋", price: 500 },
];

"use client";

import type { CatState, PetGender } from "@/store/use-store";

interface CatSpriteProps {
  cat: CatState;
  size?: number;
  onClick?: () => void;
  /** Пол питомца: у Кыз — бантик на ушке */
  gender?: PetGender;
}

// ============================================================
// Кот-тамагочи: аккуратный SVG с правильной анатомией.
// Голова — круг (70,56) r=30; мордочка строго внутри неё:
// глаза y=56, нос y=70, рот y=74–78. Тюбетейка сидит сверху,
// уши по бокам, тело с животиком и лапками — снизу.
// ============================================================

export function CatSprite({ cat, size = 160, onClick, gender = null }: CatSpriteProps) {
  // «Розовая шёрстка» из Кибета
  const isPinkFur = cat.outfit === "hair";
  const bodyColor = isPinkFur ? "#8a5a7a" : "#2A3A5C";
  const bellyColor = isPinkFur ? "#b58aa8" : "#3D5175";
  const pawDark = isPinkFur ? "#6e4461" : "#1E2C46";

  const eyeColor =
    cat.mood === "happy" || cat.mood === "playing" ? "#E8C84A" : "#A9BCD0";

  const isGoldTubeteika = cat.outfit === "tubeteika-gold";
  const tubColor = isGoldTubeteika ? "#B8912B" : "#0F5132";
  const tubGold = isGoldTubeteika ? "#FFF3C4" : "#D4AF37";

  // Анимация всего кота по настроению
  let animStyle = "";
  if (cat.mood === "happy") animStyle = "cat-bounce 1.6s ease-in-out infinite";
  else if (cat.mood === "playing") animStyle = "cat-wiggle 1.2s ease-in-out infinite";
  else if (cat.mood === "hungry") animStyle = "cat-hungry 2.2s ease-in-out infinite";

  const sleeping = cat.mood === "sleeping";
  const joyful = cat.mood === "happy" || cat.mood === "playing";

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        position: "relative",
        cursor: onClick ? "pointer" : undefined,
        animation: animStyle,
        filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.35))",
      }}
    >
      <svg viewBox="0 0 140 150" width={size} height={size}>
        {/* Хвост (за телом) */}
        <path
          d="M 102 118 Q 128 110 124 82 Q 123 75 116 79 Q 110 90 100 106"
          fill="none"
          stroke={bodyColor}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <circle cx="121" cy="80" r="5" fill={bellyColor} />

        {/* Задние лапки */}
        <ellipse cx="50" cy="140" rx="13" ry="7" fill={pawDark} />
        <ellipse cx="90" cy="140" rx="13" ry="7" fill={pawDark} />

        {/* Тело */}
        <ellipse cx="70" cy="112" rx="36" ry="30" fill={bodyColor} />
        <ellipse cx="70" cy="118" rx="24" ry="20" fill={bellyColor} />

        {/* Камзол поверх тела */}
        {cat.outfit === "kamzol" && (
          <g>
            <rect x="44" y="92" width="52" height="36" rx="10" fill="#8B0000" opacity="0.92" />
            <rect x="68.5" y="92" width="3" height="36" fill={tubGold} />
            <circle cx="70" cy="102" r="2.5" fill={tubGold} />
            <circle cx="70" cy="112" r="2.5" fill={tubGold} />
            <circle cx="70" cy="122" r="2.5" fill={tubGold} />
          </g>
        )}

        {/* Передние лапки */}
        <rect x="53" y="122" width="15" height="22" rx="7.5" fill={bodyColor} />
        <rect x="72" y="122" width="15" height="22" rx="7.5" fill={bodyColor} />
        <circle cx="60.5" cy="140" r="2" fill={bellyColor} />
        <circle cx="79.5" cy="140" r="2" fill={bellyColor} />

        {/* Ичиги — сапожки на лапках */}
        {cat.outfit === "ichigi" && (
          <g>
            <rect x="51" y="132" width="19" height="12" rx="5" fill="#8B0000" />
            <rect x="70" y="132" width="19" height="12" rx="5" fill="#8B0000" />
            <rect x="51" y="132" width="19" height="3.5" rx="1.5" fill={tubGold} />
            <rect x="70" y="132" width="19" height="3.5" rx="1.5" fill={tubGold} />
          </g>
        )}

        {/* Уши */}
        <polygon points="48,38 40,10 66,28" fill={bodyColor} />
        <polygon points="92,38 100,10 74,28" fill={bodyColor} />
        <polygon points="49,33 44,15 61,28" fill={bellyColor} opacity="0.7" />
        <polygon points="91,33 96,15 79,28" fill={bellyColor} opacity="0.7" />

        {/* Голова */}
        <circle cx="70" cy="56" r="30" fill={bodyColor} />

        {/* Щёчки-румянец */}
        <ellipse cx="50" cy="66" rx="5.5" ry="3.2" fill="#E88" opacity="0.4" />
        <ellipse cx="90" cy="66" rx="5.5" ry="3.2" fill="#E88" opacity="0.4" />

        {/* Глаза: внутри головы, y=56 */}
        {sleeping ? (
          <g stroke="#A9BCD0" strokeWidth="2.4" strokeLinecap="round">
            <line x1="51" y1="56" x2="64" y2="56" />
            <line x1="76" y1="56" x2="89" y2="56" />
          </g>
        ) : joyful ? (
          // радостные закрытые глазки-дуги
          <g fill="none" stroke={eyeColor} strokeWidth="2.6" strokeLinecap="round">
            <path d="M 52 58 Q 58 50 64 58" />
            <path d="M 76 58 Q 82 50 88 58" />
          </g>
        ) : (
          // открытые глаза с морганием
          <g style={{ animation: "cat-blink 4.5s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "center" }}>
            <circle cx="58" cy="56" r="5.4" fill={eyeColor} />
            <circle cx="82" cy="56" r="5.4" fill={eyeColor} />
            <circle cx="58" cy="56" r="2.4" fill="#10231a" />
            <circle cx="82" cy="56" r="2.4" fill="#10231a" />
            <circle cx="59.6" cy="54.2" r="1.3" fill="#fff" />
            <circle cx="83.6" cy="54.2" r="1.3" fill="#fff" />
          </g>
        )}

        {/* Слезинка, если голоден */}
        {cat.mood === "hungry" && (
          <path d="M 90 64 q 4 6 0 9 q -4 -3 0 -9" fill="#7EC8F7" opacity="0.9" />
        )}

        {/* Нос-треугольник */}
        <path d="M 66 69 L 74 69 L 70 73.5 Z" fill="#F0908C" stroke="#C96A66" strokeWidth="0.8" strokeLinejoin="round" />

        {/* Рот */}
        {joyful ? (
          <path d="M 70 73.5 Q 70 78 64.5 78 M 70 73.5 Q 70 78 75.5 78" fill="none" stroke="#C96A66" strokeWidth="1.6" strokeLinecap="round" />
        ) : cat.mood === "hungry" ? (
          <path d="M 65 80 Q 70 77.5 75 80" fill="none" stroke="#C96A66" strokeWidth="1.6" strokeLinecap="round" />
        ) : sleeping ? (
          <circle cx="70" cy="77" r="1.4" fill="#C96A66" />
        ) : (
          <path d="M 66 77.5 Q 70 79.5 74 77.5" fill="none" stroke="#C96A66" strokeWidth="1.6" strokeLinecap="round" />
        )}

        {/* Усы */}
        <g stroke="#8fa3bd" strokeWidth="1" opacity="0.65" strokeLinecap="round">
          <line x1="26" y1="58" x2="46" y2="61" />
          <line x1="26" y1="65" x2="46" y2="65" />
          <line x1="28" y1="72" x2="46" y2="69" />
          <line x1="114" y1="58" x2="94" y2="61" />
          <line x1="114" y1="65" x2="94" y2="65" />
          <line x1="112" y1="72" x2="94" y2="69" />
        </g>

        {/* Тюбетейка: сидит на макушке (верх головы y=26) */}
        <rect x="44" y="16" width="52" height="15" rx="7" fill={tubColor} />
        <ellipse cx="70" cy="31" rx="26" ry="8" fill={tubColor} />
        <g stroke={tubGold} strokeWidth="1.6" opacity="0.75">
          <line x1="56" y1="18" x2="56" y2="29" />
          <line x1="64" y1="17" x2="64" y2="30" />
          <line x1="72" y1="17" x2="72" y2="30" />
          <line x1="80" y1="18" x2="80" y2="29" />
        </g>
        <circle cx="70" cy="16" r="3.6" fill={tubGold} />
        <circle cx="68.8" cy="14.8" r="1.1" fill="#fff" opacity="0.8" />

        {/* Яулык (платок): лобная лента + завязки */}
        {cat.outfit === "platok" && (
          <g>
            <path d="M 42 42 Q 70 33 98 42" fill="none" stroke={tubGold} strokeWidth="6" strokeLinecap="round" opacity="0.55" />
            <path d="M 48 82 Q 44 96 50 108" fill="none" stroke={tubGold} strokeWidth="5" strokeLinecap="round" opacity="0.7" />
            <path d="M 92 82 Q 96 96 90 108" fill="none" stroke={tubGold} strokeWidth="5" strokeLinecap="round" opacity="0.7" />
          </g>
        )}

        {/* Бантик для Кыз — на правом ушке */}
        {gender === "kyz" && (
          <g>
            <circle cx="98" cy="14" r="5.5" fill="#E86A92" />
            <circle cx="107" cy="18" r="5.5" fill="#E86A92" />
            <circle cx="102.5" cy="16" r="2.8" fill="#C1272D" />
          </g>
        )}

        {/* Zzz во сне */}
        {sleeping && (
          <g fill="#E8C84A" fontWeight="bold" opacity="0.85" style={{ animation: "cat-zzz 2.2s ease-in-out infinite" }}>
            <text x="104" y="34" fontSize="13">Z</text>
            <text x="112" y="24" fontSize="10">z</text>
          </g>
        )}
      </svg>

      {/* Индикатор настроения */}
      <div
        style={{
          position: "absolute",
          bottom: 2,
          right: 2,
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "var(--surface)",
          border: "2px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          boxShadow: "var(--card-shadow)",
        }}
      >
        {cat.mood === "happy" && "😊"}
        {cat.mood === "normal" && "😺"}
        {cat.mood === "hungry" && "😿"}
        {cat.mood === "sleeping" && "😴"}
        {cat.mood === "playing" && "🎉"}
      </div>
    </div>
  );
}

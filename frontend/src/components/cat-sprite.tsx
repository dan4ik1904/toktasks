"use client";

import type { CatState } from "@/store/use-store";

interface CatSpriteProps {
  cat: CatState;
  size?: number;
  onClick?: () => void;
}

export function CatSprite({ cat, size = 160, onClick }: CatSpriteProps) {
  const bodyColor = "#2A3A5C";
  const bellyColor = "#3A4E72";
  const eyeColor =
    cat.mood === "happy" || cat.mood === "playing" ? "#D4AF37" : "#8892B0";
  const tubeteikaColor = "#0F5132";
  const tubeteikaGold = "#D4AF37";
  const eyeY = cat.mood === "sleeping" ? 8 : 6;

  let animStyle = "";
  if (cat.mood === "happy") animStyle = "cat-bounce 1.5s ease-in-out infinite";
  else if (cat.mood === "playing")
    animStyle = "cat-wiggle 1.2s ease-in-out infinite";
  else if (cat.mood === "hungry")
    animStyle = "cat-hungry 2s ease-in-out infinite";
  else if (cat.mood === "sleeping") animStyle = "";
  else animStyle = "cat-blink 4s ease-in-out infinite";

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        position: "relative",
        cursor: onClick ? "pointer" : undefined,
        animation: animStyle,
        filter: "drop-shadow(0 0 20px rgba(212,175,55,0.2))",
      }}
    >
      <svg viewBox="0 0 120 120" width={size} height={size}>
        {/* Body */}
        <ellipse cx="60" cy="78" rx="32" ry="28" fill={bodyColor} />
        <ellipse cx="60" cy="82" rx="22" ry="18" fill={bellyColor} />

        {/* Paws */}
        <ellipse cx="42" cy="100" rx="10" ry="6" fill={bodyColor} />
        <ellipse cx="78" cy="100" rx="10" ry="6" fill={bodyColor} />
        <circle cx="38" cy="100" r="2" fill={bellyColor} />
        <circle cx="42" cy="98" r="2" fill={bellyColor} />
        <circle cx="46" cy="100" r="2" fill={bellyColor} />
        <circle cx="74" cy="100" r="2" fill={bellyColor} />
        <circle cx="78" cy="98" r="2" fill={bellyColor} />
        <circle cx="82" cy="100" r="2" fill={bellyColor} />

        {/* Tail */}
        <path
          d="M 88 80 Q 105 65 100 45 Q 98 40 92 45 Q 88 55 85 72"
          fill="none"
          stroke={bodyColor}
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Head */}
        <circle cx="60" cy="48" r="24" fill={bodyColor} />

        {/* Ears */}
        <polygon points="40,32 36,12 50,26" fill={bodyColor} />
        <polygon points="80,32 84,12 70,26" fill={bodyColor} />
        <polygon points="42,30 39,16 50,27" fill={bellyColor} opacity="0.5" />
        <polygon points="78,30 81,16 70,27" fill={bellyColor} opacity="0.5" />

        {/* Tubeteika */}
        <ellipse cx="60" cy="28" rx="20" ry="8" fill={tubeteikaColor} />
        <rect x="42" y="20" width="36" height="10" rx="4" fill={tubeteikaColor} />
        <line x1="48" y1="22" x2="48" y2="28" stroke={tubeteikaGold} strokeWidth="1.5" opacity="0.6" />
        <line x1="56" y1="21" x2="56" y2="29" stroke={tubeteikaGold} strokeWidth="1.5" opacity="0.6" />
        <line x1="64" y1="21" x2="64" y2="29" stroke={tubeteikaGold} strokeWidth="1.5" opacity="0.6" />
        <line x1="72" y1="22" x2="72" y2="28" stroke={tubeteikaGold} strokeWidth="1.5" opacity="0.6" />
        <circle cx="60" cy="20" r="3" fill={tubeteikaGold} />

        {/* Eyes */}
        {cat.mood === "sleeping" ? (
          <>
            <line x1="48" y1={eyeY} x2="55" y2={eyeY} stroke={eyeColor} strokeWidth="2" strokeLinecap="round" />
            <line x1="65" y1={eyeY} x2="72" y2={eyeY} stroke={eyeColor} strokeWidth="2" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="50" cy={eyeY} r="3.5" fill={eyeColor} />
            <circle cx="70" cy={eyeY} r="3.5" fill={eyeColor} />
            <circle cx="51" cy={eyeY - 1} r="1.2" fill="#fff" />
            <circle cx="71" cy={eyeY - 1} r="1.2" fill="#fff" />
          </>
        )}

        {/* Nose */}
        <ellipse cx="60" cy="12" rx="2.5" ry="2" fill="#E88" />

        {/* Mouth */}
        {cat.mood === "happy" || cat.mood === "playing" ? (
          <path d="M 55 14 Q 60 18 65 14" fill="none" stroke="#E88" strokeWidth="1.2" strokeLinecap="round" />
        ) : cat.mood === "hungry" ? (
          <path d="M 55 16 Q 60 13 65 16" fill="none" stroke="#E88" strokeWidth="1.2" strokeLinecap="round" />
        ) : (
          <line x1="57" y1="14" x2="63" y2="14" stroke="#E88" strokeWidth="1.2" strokeLinecap="round" />
        )}

        {/* Whiskers */}
        <line x1="35" y1="10" x2="48" y2="12" stroke="#8892B0" strokeWidth="0.8" opacity="0.5" />
        <line x1="35" y1="14" x2="48" y2="14" stroke="#8892B0" strokeWidth="0.8" opacity="0.5" />
        <line x1="72" y1="12" x2="85" y2="10" stroke="#8892B0" strokeWidth="0.8" opacity="0.5" />
        <line x1="72" y1="14" x2="85" y2="14" stroke="#8892B0" strokeWidth="0.8" opacity="0.5" />

        {/* Sleeping Zzz */}
        {cat.mood === "sleeping" && (
          <text x="85" y="35" fill="#D4AF37" fontSize="12" fontWeight="bold" opacity="0.7"
            style={{ animation: "cat-zzz 2s ease-in-out infinite" }}>
            Z
          </text>
        )}

        {/* Outfit overlay: Kamzol */}
        {cat.outfit === "kamzol" && (
          <rect x="42" y="65" width="36" height="20" rx="4" fill="#8B0000" opacity="0.8" />
        )}

        {/* Outfit overlay: Platok */}
        {cat.outfit === "platok" && (
          <>
            <path d="M 36 36 Q 60 44 84 36 Q 84 52 60 56 Q 36 52 36 36Z" fill="#D4AF37" opacity="0.4" />
          </>
        )}
      </svg>

      {/* Mood indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "var(--surface)",
          border: "2px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
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

"use client";

export type CatMood = "happy" | "normal" | "hungry" | "sleepy";
export type CatAction = "idle" | "eating" | "petted" | "talking";
export type CatOutfit = string;

interface CatSpriteProps {
  mood?: CatMood;
  action?: CatAction;
  outfit?: CatOutfit;
  size?: number;
}

/**
 * Иптәш — рисованный снежный барс (SVG).
 * Настроения меняют глаза/рот, наряды надеваются поверх,
 * всё анимируется чистым CSS (дыхание, моргание, хвост, Zzz).
 */
export function CatSprite({ mood = "normal", action = "idle", outfit = "none", size = 140 }: CatSpriteProps) {
  const eyesClosed = mood === "sleepy";
  const eyesHappy = mood === "happy" || action === "petted";
  const mouthOpen = action === "eating" || action === "talking";

  const animClass =
    action === "petted" ? "cat-squash" : mood === "happy" ? "cat-bounce-soft" : mood === "sleepy" ? "cat-sleepy" : "";

  return (
    <div style={{ width: size, height: size, position: "relative" }} className="cat-breathe">
      <svg viewBox="0 0 200 200" width={size} height={size} aria-label="Иптәш" role="img">
        {/* Хвост */}
        <g className="cat-tail" style={{ transformOrigin: "150px 165px" }}>
          <path
            d="M150 168 C 178 165, 186 140, 172 128 C 164 121, 154 124, 154 132 C 154 139, 162 141, 166 137"
            fill="none"
            stroke="#EDE6D3"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M150 168 C 178 165, 186 140, 172 128"
            fill="none"
            stroke="#D9CFB4"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray="2 14"
            opacity="0.8"
          />
        </g>

        {/* Тело */}
        <ellipse cx="100" cy="152" rx="44" ry="36" fill="#F7F2E4" />
        <ellipse cx="78" cy="150" rx="7" ry="9" fill="#DCD2B8" opacity="0.7" />
        <ellipse cx="122" cy="156" rx="8" ry="10" fill="#DCD2B8" opacity="0.7" />
        <ellipse cx="104" cy="168" rx="6" ry="7" fill="#DCD2B8" opacity="0.6" />
        {/* Лапки */}
        <rect x="76" y="168" width="18" height="20" rx="9" fill="#F7F2E4" stroke="#E3D9BE" strokeWidth="2" />
        <rect x="106" y="168" width="18" height="20" rx="9" fill="#F7F2E4" stroke="#E3D9BE" strokeWidth="2" />

        <g className={animClass}>
          {/* Уши */}
          <path d="M68 62 L60 32 L86 48 Z" fill="#F7F2E4" stroke="#E3D9BE" strokeWidth="2" strokeLinejoin="round" />
          <path d="M132 62 L140 32 L114 48 Z" fill="#F7F2E4" stroke="#E3D9BE" strokeWidth="2" strokeLinejoin="round" />
          <path d="M69 55 L65 40 L79 49 Z" fill="#F2A9B8" opacity="0.8" />
          <path d="M131 55 L135 40 L121 49 Z" fill="#F2A9B8" opacity="0.8" />

          {/* Голова */}
          <circle cx="100" cy="88" r="37" fill="#FAF6EA" />
          {/* Пятна барса */}
          <ellipse cx="78" cy="70" rx="4" ry="5" fill="#DCD2B8" opacity="0.8" />
          <ellipse cx="122" cy="70" rx="4" ry="5" fill="#DCD2B8" opacity="0.8" />
          <ellipse cx="100" cy="60" rx="4" ry="5" fill="#DCD2B8" opacity="0.6" />

          {/* Глаза */}
          {eyesClosed ? (
            <g stroke="#3A3428" strokeWidth="3" strokeLinecap="round" fill="none">
              <path d="M78 90 q 8 6 16 0" />
              <path d="M106 90 q 8 6 16 0" />
            </g>
          ) : eyesHappy ? (
            <g stroke="#3A3428" strokeWidth="3.5" strokeLinecap="round" fill="none">
              <path d="M76 92 q 9 -9 18 0" />
              <path d="M106 92 q 9 -9 18 0" />
            </g>
          ) : (
            <g className="cat-eyes">
              <ellipse cx="86" cy="90" rx="7" ry="8.5" fill="#3A3428" />
              <ellipse cx="114" cy="90" rx="7" ry="8.5" fill="#3A3428" />
              <circle cx="88.5" cy="87" r="2.6" fill="#fff" />
              <circle cx="116.5" cy="87" r="2.6" fill="#fff" />
              {mood === "hungry" && (
                <>
                  <circle cx="88.5" cy="87" r="4.2" fill="none" stroke="#fff" strokeWidth="1" opacity="0.7" />
                  <circle cx="116.5" cy="87" r="4.2" fill="none" stroke="#fff" strokeWidth="1" opacity="0.7" />
                </>
              )}
            </g>
          )}

          {/* Румянец */}
          {(eyesHappy || mood === "hungry") && (
            <>
              <ellipse cx="70" cy="102" rx="6" ry="3.5" fill="#F2A9B8" opacity="0.65" />
              <ellipse cx="130" cy="102" rx="6" ry="3.5" fill="#F2A9B8" opacity="0.65" />
            </>
          )}

          {/* Нос и рот */}
          <path d="M95 102 L105 102 L100 107 Z" fill="#E0788A" />
          {mouthOpen ? (
            <ellipse cx="100" cy="114" rx="6" ry="7" fill="#7A3B46" />
          ) : (
            <path d="M100 107 q 0 5 -7 5 M100 107 q 0 5 7 5" stroke="#3A3428" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}

          {/* Усы */}
          <g stroke="#CFC4A6" strokeWidth="1.6" strokeLinecap="round">
            <line x1="52" y1="98" x2="72" y2="101" />
            <line x1="52" y1="108" x2="72" y2="105" />
            <line x1="148" y1="98" x2="128" y2="101" />
            <line x1="148" y1="108" x2="128" y2="105" />
          </g>

          {/* Наряды */}
          {outfit === "tubetey" && (
            <g>
              <path d="M72 58 A 30 30 0 0 1 128 58 L 128 52 A 30 30 0 0 0 72 52 Z" fill="#0F5132" />
              <ellipse cx="100" cy="52" rx="28" ry="7" fill="#0F5132" />
              <ellipse cx="100" cy="50" rx="6" ry="3" fill="#E3B93F" />
              <circle cx="82" cy="55" r="2.4" fill="#E3B93F" />
              <circle cx="118" cy="55" r="2.4" fill="#E3B93F" />
              <circle cx="100" cy="57" r="2.4" fill="#E3B93F" />
            </g>
          )}
          {outfit === "scarf" && (
            <g>
              <path d="M68 118 Q 100 132 132 118 L 132 130 Q 100 144 68 130 Z" fill="#C1272D" />
              <path d="M68 118 Q 100 132 132 118" fill="none" stroke="#E3B93F" strokeWidth="2.5" />
              <rect x="112" y="128" width="14" height="20" rx="5" fill="#A11F24" transform="rotate(12 119 138)" />
            </g>
          )}
          {outfit === "glasses" && (
            <g stroke="#2B2620" strokeWidth="3" fill="rgba(180,220,255,0.25)">
              <rect x="72" y="80" width="26" height="20" rx="9" />
              <rect x="102" y="80" width="26" height="20" rx="9" />
              <line x1="98" y1="88" x2="102" y2="88" />
            </g>
          )}
          {outfit === "crown" && (
            <g>
              <path d="M76 52 L80 28 L92 44 L100 24 L108 44 L120 28 L124 52 Z" fill="#E3B93F" stroke="#A97E14" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="80" cy="26" r="3" fill="#C1272D" />
              <circle cx="100" cy="22" r="3.4" fill="#12A56A" />
              <circle cx="120" cy="26" r="3" fill="#C1272D" />
            </g>
          )}
        </g>

      </svg>

      {/* Zzz при сне */}
      {mood === "sleepy" && (
        <>
          <span className="cat-zzz" style={{ left: "72%", top: "6%", animationDelay: "0s" }}>z</span>
          <span className="cat-zzz" style={{ left: "80%", top: "14%", animationDelay: "0.7s", fontSize: "1rem" }}>z</span>
          <span className="cat-zzz" style={{ left: "66%", top: "18%", animationDelay: "1.3s", fontSize: "0.8rem" }}>z</span>
        </>
      )}
    </div>
  );
}

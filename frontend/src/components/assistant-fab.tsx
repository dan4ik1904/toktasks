"use client";

import { useState } from "react";
import { X, Languages, Volume2 } from "lucide-react";
import { translateViaApi, assistantChatApi, ttsSpeak } from "@/lib/api";

// ============================================================
// Мини-помощник: маленький тамагочи в правом нижнем углу.
// По нажатию — всплывашка с полем ввода: слово на русском или
// татарском → перевод + пример употребления (LLM).
// Закрывается по клику вне всплывашки. Язык определяем
// по татарским буквам әөүҗңһ.
// ============================================================

const TT_LETTERS = /[әөүҗңһӘӨҮҖҢҺ]/;

export function AssistantFab() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [example, setExample] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    const text = query.trim();
    if (!text || loading) return;
    setLoading(true);
    setTranslation(null);
    setExample(null);
    setError(null);

    // направление: есть татарские буквы → tt→ru, иначе ru→tt
    const isTt = TT_LETTERS.test(text);
    const src = isTt ? "tt" : "ru";
    const dst = isTt ? "ru" : "tt";

    try {
      const tr = await translateViaApi(text, src, dst);
      if (tr) setTranslation(tr);
      else setError("Переводчик недоступен — попробуй позже");
    } catch {
      setError("Переводчик недоступен — попробуй позже");
    }

    // пример употребления через ассистента (не критично — молча пропускаем)
    try {
      const ans = await assistantChatApi(
        `Слово «${text}» (${src === "ru" ? "русское" : "татарское"}). Дай ОДИН короткий пример употребления на татарском с переводом на русский. Формат: татарское предложение в «кавычках» + перевод.`
      );
      setExample(ans.reply);
    } catch {
      /* без примера — перевод уже есть */
    }
    setLoading(false);
  };

  const speakTranslation = () => {
    if (translation) void ttsSpeak(translation, "alsu");
  };

  return (
    <>
      {/* Кнопка-помощник */}
      <button className="assistant-fab" onClick={() => setOpen(true)} aria-label="Помощник-переводчик">
        🐱
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal-sheet animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: 10 }}>
              <span style={{ fontSize: "1.6rem" }}>🐱</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>Ярдәмче-переводчик</div>
                <div style={{ fontSize: "0.72rem", color: "var(--fg-muted)" }}>слово на русском или татарском</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Закрыть">
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input
                className="helper-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ask()}
                placeholder="Мәсәлән: спасибо / рәхмәт…"
                autoFocus
              />
              <button className="btn btn-gold" onClick={ask} disabled={loading || !query.trim()}>
                <Languages size={16} />
              </button>
            </div>

            {loading && (
              <p style={{ marginTop: 10, fontSize: "0.82rem", color: "var(--fg-muted)", textAlign: "center" }}>
                😺 Думаю…
              </p>
            )}

            {translation && (
              <div className="card card-gold animate-pop" style={{ marginTop: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.68rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Перевод
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>{translation}</div>
                  </div>
                  <button className="btn btn-sm btn-ghost" onClick={speakTranslation} aria-label="Озвучить">
                    <Volume2 size={16} />
                  </button>
                </div>
              </div>
            )}

            {example && (
              <div className="card animate-fade-in" style={{ marginTop: 8 }}>
                <div style={{ fontSize: "0.68rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Пример
                </div>
                <div style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>{example}</div>
              </div>
            )}

            {error && (
              <p style={{ marginTop: 10, fontSize: "0.82rem", color: "var(--danger)", textAlign: "center" }}>
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

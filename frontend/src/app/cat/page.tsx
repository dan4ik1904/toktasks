"use client";

import { useState, useRef, useCallback } from "react";
import { CatSprite } from "@/components/cat-sprite";
import { useStore } from "@/store/use-store";

const FOODS = [
  { id: "ipi", name: "Ипек", icon: "🍞", hunger: 20 },
  { id: "chai", name: "Чәй", icon: "🍵", hunger: 15 },
  { id: "echpochmak", name: "Эчпочмак", icon: "🥟", hunger: 30 },
  { id: "balesh", name: "Бәлеш", icon: "🥧", hunger: 25 },
  { id: "oochpochmak", name: "Өчпочмак", icon: "🔺", hunger: 35 },
];

const OUTFITS = [
  { id: "default", name: "Тюбетейка", price: 0, icon: "🧢" },
  { id: "kamzol", name: "Камзол", price: 100, icon: "🥋" },
  { id: "platok", name: "Платок", price: 80, icon: "🧣" },
];

export default function CatPage() {
  const store = useStore();
  const { cat, points, feedCat, dressCat, playWithCat, spendPoints, buyShopItem, shopPurchases } = store;
  const [tab, setTab] = useState<"chat" | "feed" | "play" | "dress">("chat");
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
  const [floatEmoji, setFloatEmoji] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [subtitles, setSubtitles] = useState<string>("");
  const [catMood, setCatMood] = useState<string>("happy");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const showFloat = (emoji: string) => {
    setFloatEmoji(emoji);
    setTimeout(() => setFloatEmoji(null), 1000);
  };

  const handleFeed = (food: (typeof FOODS)[0]) => {
    feedCat(food.id, food.hunger, "happy");
    showFloat(food.icon);
  };

  const handlePlay = () => {
    playWithCat();
    showFloat("🎾");
  };

  const handleDress = (outfit: (typeof OUTFITS)[0]) => {
    if (outfit.price > 0 && !shopPurchases.includes(outfit.id)) {
      if (!spendPoints(outfit.price)) return;
      buyShopItem(outfit.id);
    }
    dressCat(outfit.id);
  };

  const playCatTts = async (text: string) => {
    if (!text.trim()) return;
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(base + "/api/cat/tts?text=" + encodeURIComponent(text));
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioRef.current = new Audio(url);
        audioRef.current.play().catch(() => {});
      }
    } catch {}
  };

  const handleVoiceChat = useCallback(async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        setIsThinking(true);
        setSubtitles("Распознаю речь...");

        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const form = new FormData();
        form.append("audio", blob, "voice.webm");

        try {
          const res = await fetch(base + "/api/cat/chat", { method: "POST", body: form });
          const data = await res.json();
          setSubtitles(data.reply || data.say || "Мяв?");
          setCatMood(data.mood || "happy");
          setChatHistory((h) => [
            ...h,
            { role: "user", text: data.text || "🎤 Голосовое сообщение" },
            { role: "assistant", text: data.reply },
          ]);
          if (data.say) {
            playCatTts(data.say);
          }
        } catch {
          setSubtitles("Мяв! Ошибка соединения 🐱");
        }
        setIsThinking(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setSubtitles("🎤 Слушаю... Нажми чтобы остановить");
      setCatMood("thinking");
    } catch {
      setSubtitles("Микрофон недоступен 😿");
    }
  }, [isRecording]);

  const handleChat = async () => {
    if (!chatMsg.trim()) return;
    const msg = chatMsg.trim();
    setChatMsg("");
    setChatHistory((h) => [...h, { role: "user", text: msg }]);
    setIsThinking(true);

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(base + "/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: chatHistory.slice(-6) }),
      });
      const data = await res.json();
      setChatHistory((h) => [...h, { role: "assistant", text: data.reply }]);
      if (data.say) {
        playCatTts(data.say);
      }
    } catch {
      setChatHistory((h) => [...h, { role: "assistant", text: "Мяв! Не могу ответить 🐱" }]);
    }
    setIsThinking(false);
  };

  return (
    <div className="page-shell" style={{ alignItems: "center" }}>
      <h1 className="page-title" style={{ color: "var(--gold)" }}>Мой кот</h1>

      <div style={{ position: "relative" }}>
        <CatSprite cat={{ ...cat, mood: catMood as typeof cat.mood }} size={200} />
        {floatEmoji && (
          <div style={{ position: "absolute", top: -20, left: "50%", fontSize: "2rem", animation: "float-up 1s ease forwards" }}>
            {floatEmoji}
          </div>
        )}
      </div>

      {subtitles && (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.75rem",
          padding: "0.6rem 1rem", fontSize: "0.85rem", color: "var(--fg)", textAlign: "center",
          width: "100%", maxWidth: 320, minHeight: 40,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {isThinking ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="cat-blink" style={{ display: "inline-block", animation: "cat-bounce 1s infinite" }}>😺</span>
              {subtitles}
            </span>
          ) : subtitles}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
        {(["chat", "feed", "play", "dress"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={"btn " + (tab === t ? "btn-primary" : "btn-ghost")}
            style={{ flex: 1, fontSize: "0.75rem", padding: "0.5rem" }}>
            {t === "chat" ? "💬 Чат" : t === "feed" ? "🍲 Кормить" : t === "play" ? "🎾 Играть" : "👗 Одеть"}
          </button>
        ))}
      </div>

      <div className="card" style={{ width: "100%" }}>
        {tab === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {chatHistory.length === 0 && (
                <p style={{ color: "var(--fg-muted)", fontSize: "0.8rem", textAlign: "center" }}>
                  Поговори со мной на татарском! 🐱
                </p>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  padding: "0.5rem 0.75rem", borderRadius: "1rem",
                  background: msg.role === "user" ? "var(--accent)" : "var(--surface-2)",
                  color: msg.role === "user" ? "#fff" : "var(--fg)",
                  fontSize: "0.8rem", maxWidth: "80%",
                }}>{msg.text}</div>
              ))}
              {isThinking && (
                <div style={{
                  alignSelf: "flex-start", padding: "0.5rem 0.75rem", borderRadius: "1rem",
                  background: "var(--surface-2)", color: "var(--fg-muted)", fontSize: "0.8rem",
                }}>
                  <span className="cat-blink" style={{ animation: "cat-bounce 1s infinite" }}>😺</span> думает...
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button
                onClick={handleVoiceChat}
                className={"btn " + (isRecording ? "btn-danger" : "btn-gold")}
                style={{ padding: "0.6rem", borderRadius: "50%", width: 40, height: 40, fontSize: "1.1rem" }}
                title={isRecording ? "Остановить запись" : "Голосовой чат"}
              >
                {isRecording ? "⏹" : "🎤"}
              </button>
              <input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChat()}
                placeholder="Напиши на татарском..."
                style={{ flex: 1, padding: "0.6rem 0.8rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)", fontSize: "0.85rem" }} />
              <button className="btn btn-primary" onClick={handleChat} style={{ padding: "0.6rem 1rem" }}>→</button>
            </div>
          </div>
        )}

        {tab === "feed" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
            {FOODS.map((food) => (
              <button key={food.id} onClick={() => handleFeed(food)}
                className="btn btn-ghost"
                style={{ flexDirection: "column", padding: "0.75rem", fontSize: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{food.icon}</span>{food.name}
              </button>
            ))}
          </div>
        )}

        {tab === "play" && (
          <div style={{ textAlign: "center", padding: "1rem" }}>
            <p style={{ marginBottom: 12, color: "var(--fg-muted)" }}>Поиграй с котом!</p>
            <button className="btn btn-gold" onClick={handlePlay}>🎾 Играть с котом</button>
          </div>
        )}

        {tab === "dress" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {OUTFITS.map((outfit) => {
              const owned = outfit.price === 0 || shopPurchases.includes(outfit.id);
              const active = cat.outfit === outfit.id;
              return (
                <button key={outfit.id} onClick={() => handleDress(outfit)}
                  className={"btn " + (active ? "btn-gold" : "btn-ghost")}
                  style={{ justifyContent: "space-between", padding: "0.75rem" }}>
                  <span>{outfit.icon} {outfit.name}</span>
                  <span style={{ fontSize: "0.75rem", color: owned ? "var(--success)" : "var(--gold)" }}>
                    {owned ? (active ? "Надето ✓" : "Надеть") : outfit.price + " 💰"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="card" style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.65rem", color: "var(--fg-muted)" }}>Настроение</div>
          <div style={{ fontSize: "1.2rem" }}>
            {catMood === "happy" ? "😊" : catMood === "hungry" ? "😿" : catMood === "sleeping" ? "😴" : catMood === "playful" ? "🎉" : catMood === "thinking" ? "🤔" : "😺"}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.65rem", color: "var(--fg-muted)" }}>Сытость</div>
          <div style={{ fontWeight: 700 }}>{cat.hunger}%</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "0.65rem", color: "var(--fg-muted)" }}>Уровень</div>
          <div style={{ fontWeight: 700 }}>{cat.level}</div>
        </div>
      </div>
    </div>
  );
}

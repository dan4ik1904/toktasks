"use client";

import { useState, useRef, useCallback } from "react";
import { MessageCircle, UtensilsCrossed, Heart, Shirt, Mic, Send, Sparkles, BookOpen } from "lucide-react";
import { CatSprite } from "@/components/cat-sprite";
import { useStore, satietyMultiplier } from "@/store/use-store";
import { FOODS, OUTFITS, type Food, type Outfit } from "@/games/catalog";

// ============================================================
// Страница кота: hero с питомцем, сытость и опыт,
// табы Чат / Ашхана / Ласка / Кибет, советы и мәкаль дня.
// Голосовой чат: запись → WAV → STT → GigaChat → TTS.
// ============================================================

// Мәкаль дня — ротация по дню года
const PROVERBS = [
  { tt: "Белем — нур, белмәү — хур", ru: "Знание — свет, незнание — позор" },
  { tt: "Дуслык — иң зур байлык", ru: "Дружба — самое большое богатство" },
  { tt: "Эш беткәч — уйнарга ярый", ru: "Сделал дело — гуляй смело" },
  { tt: "Туган тел — ана теле", ru: "Родной язык — материнский" },
];

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  }

  writeString(0, "RIFF");
  view.setUint32(4, totalLength - 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) channels.push(buffer.getChannelData(i));

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

// Кулдаун ласки — 10 секунд
const PET_COOLDOWN_MS = 10_000;

export default function CatPage() {
  const store = useStore();
  const { cat, points, gender, gamesPlayed, feedCat, dressCat, playWithCat, addCatExp, spendPoints, buyShopItem, shopPurchases } = store;
  const [tab, setTab] = useState<"chat" | "feed" | "pet" | "dress">("chat");
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
  const [floatEmoji, setFloatEmoji] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [subtitles, setSubtitles] = useState<string>("");
  const [catMood, setCatMood] = useState<string>("happy");
  const [feedMsg, setFeedMsg] = useState<string | null>(null);
  const [petMsg, setPetMsg] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPetRef = useRef(0);

  const showFloat = (emoji: string) => {
    setFloatEmoji(emoji);
    setTimeout(() => setFloatEmoji(null), 1000);
  };

  // Производное настроение: голодный и сонный кот — поверх чат-настроения
  const displayMood = cat.hunger <= 0 ? "sleeping" : cat.hunger < 40 ? "hungry" : catMood;
  const mult = satietyMultiplier(cat.hunger);
  const expInLevel = cat.exp % 100;
  const outfitName = OUTFITS.find((o) => o.id === cat.outfit)?.name ?? cat.outfit;
  const proverb = PROVERBS[Math.floor(Date.now() / 86_400_000) % PROVERBS.length]!;

  const moodText =
    cat.hunger <= 0 ? "😴 Спит… покорми в Ашхане!" :
    displayMood === "happy" ? "😊 Счастлив и мурлычет!" :
    displayMood === "hungry" ? "😿 Проголодался… ашыйсы килә!" :
    displayMood === "playful" ? "🎉 Готов играть!" :
    displayMood === "thinking" ? "🤔 Думает…" : "😺 Ждёт татарских слов";

  // Ашхана: еда стоит баллы, сытность растёт, анимация «ням-ням»
  const handleFeed = (food: Food) => {
    if (cat.hunger >= 100) {
      setFeedMsg("Тук! Кот уже сыт 😊");
      setTimeout(() => setFeedMsg(null), 1500);
      return;
    }
    if (!spendPoints(food.price)) {
      setFeedMsg(`Не хватает баллов: ${food.nameTt} стоит ${food.price} 💰`);
      setTimeout(() => setFeedMsg(null), 1800);
      return;
    }
    feedCat(food.id, food.satiety, "happy");
    showFloat(food.icon);
    setFeedMsg("Ням-ням! Тәмле! 😋");
    setTimeout(() => setFeedMsg(null), 1500);
  };

  // Ласка: погладить — +опыт, сердечки, кулдаун 10 сек
  const handlePet = () => {
    const now = Date.now();
    const wait = Math.ceil((PET_COOLDOWN_MS - (now - lastPetRef.current)) / 1000);
    if (wait > 0) {
      setPetMsg(`Кот отдыхает… ещё ${wait} сек 😌`);
      setTimeout(() => setPetMsg(null), 1500);
      return;
    }
    lastPetRef.current = now;
    addCatExp(4);
    showFloat("💕");
    setCatMood("happy");
    setPetMsg("Мр-р-р! Кот доволен +4 опыта 💕");
    setTimeout(() => setPetMsg(null), 1800);
  };

  const handlePlay = () => {
    playWithCat();
    setCatMood("playful");
    showFloat("🎾");
  };

  const handleDress = (outfit: Outfit) => {
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
    } catch {
      console.error("TTS failed");
    }
  };

  const handleVoiceChat = useCallback(async () => {
    if (isRecording) {
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        const ctx = audioContextRef.current;
        audioContextRef.current = null;
        await ctx.close();
      }

      setIsRecording(false);
      setIsThinking(true);
      setSubtitles("Обрабатываю...");

      if (audioChunksRef.current.length === 0) {
        setIsThinking(false);
        setSubtitles("Не записалось голоса, попробуй ещё раз");
        return;
      }

      const sampleRate = 16000;
      const length = audioChunksRef.current.reduce((acc, c) => acc + c.length, 0);
      const merged = new Float32Array(length);
      let off = 0;
      for (const chunk of audioChunksRef.current) {
        merged.set(chunk, off);
        off += chunk.length;
      }

      const tmpCtx = new AudioContext({ sampleRate });
      const buffer = tmpCtx.createBuffer(1, length, sampleRate);
      buffer.getChannelData(0).set(merged);
      await tmpCtx.close();

      const wavBlob = audioBufferToWav(buffer);

      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const form = new FormData();
      form.append("audio", wavBlob, "voice.wav");

      try {
        const res = await fetch(base + "/api/cat/chat", { method: "POST", body: form });
        const data = await res.json();
        setSubtitles(data.reply || data.say || "Мяв?");
        setCatMood(data.mood || "happy");
        setChatHistory((h) => [
          ...h,
          { role: "user", text: data.text || "🎤 Голос" },
          { role: "assistant", text: data.reply },
        ]);
        if (data.say) {
          setTimeout(() => playCatTts(data.say), 300);
        }
      } catch (e) {
        console.error("Cat chat error:", e);
        setSubtitles("Мяв! Ошибка соединения");
      }
      setIsThinking(false);
      audioChunksRef.current = [];
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      audioChunksRef.current = [];
      audioContextRef.current = audioCtx;
      mediaStreamRef.current = stream;
      sourceNodeRef.current = source;
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const data = e.inputBuffer.getChannelData(0);
        audioChunksRef.current.push(new Float32Array(data));
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      setIsRecording(true);
      setSubtitles("🎤 Слушаю... Нажми чтобы остановить");
      setCatMood("thinking");
    } catch {
      setSubtitles("Микрофон недоступен");
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
        setTimeout(() => playCatTts(data.say), 300);
      }
    } catch {
      setChatHistory((h) => [...h, { role: "assistant", text: "Мяв! Не могу ответить" }]);
    }
    setIsThinking(false);
  };

  const TABS = [
    { id: "chat", label: "Чат", icon: MessageCircle },
    { id: "feed", label: "Ашхана", icon: UtensilsCrossed },
    { id: "pet", label: "Ласка", icon: Heart },
    { id: "dress", label: "Кибет", icon: Shirt },
  ] as const;

  return (
    <div className="page-shell" style={{ alignItems: "center" }}>
      {/* Шапка */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", justifyContent: "center" }}>
        <h1 className="page-title" style={{ color: "var(--gold)" }}>Мой кот</h1>
        {gender && (
          <span className="badge badge-accent">{gender === "kyz" ? "Кыз 🎀" : "Малай 🧢"}</span>
        )}
        <span className="badge badge-gold">💰 {points}</span>
      </div>

      {/* Hero: питомец */}
      <div className="hero-card" style={{ width: "100%", padding: "1rem", textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <CatSprite
            cat={{ ...cat, mood: displayMood as typeof cat.mood }}
            gender={gender}
            size={210}
            onClick={handlePet}
          />
          {floatEmoji && (
            <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", fontSize: "2rem", animation: "float-up 1s ease forwards" }}>
              {floatEmoji}
            </div>
          )}
        </div>

        <p style={{ fontSize: "0.85rem", color: "var(--fg)", fontWeight: 700, marginTop: 4 }}>{moodText}</p>
        <p style={{ fontSize: "0.68rem", color: "var(--fg-muted)" }}>нажми на кота, чтобы погладить 💕</p>

        {/* Сытость */}
        <div style={{ marginTop: 10, textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", marginBottom: 4 }}>
            <span style={{ color: "var(--fg-muted)", fontWeight: 700 }}>🍲 СЫТОСТЬ</span>
            <span>
              <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{cat.hunger}%</span>
              {" · "}
              <span style={{ color: "var(--gold)", fontWeight: 800 }}>×{mult} к баллам</span>
            </span>
          </div>
          <div className="progress-track">
            <div
              className={cat.hunger < 40 ? "progress-fill progress-fill-red" : "progress-fill progress-fill-gold"}
              style={{ width: `${cat.hunger}%` }}
            />
          </div>
        </div>

        {/* Опыт */}
        <div style={{ marginTop: 8, textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", marginBottom: 4 }}>
            <span style={{ color: "var(--fg-muted)", fontWeight: 700 }}>⭐ ОПЫТ • Ур. {cat.level}</span>
            <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{expInLevel}/100</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${expInLevel}%` }} />
          </div>
        </div>
      </div>

      {/* Субтитры голосового чата */}
      {subtitles && (
        <div style={{
          background: "var(--surface-glass)", border: "1px solid var(--border)", borderRadius: "0.9rem",
          padding: "0.6rem 1rem", fontSize: "0.85rem", color: "var(--fg)", textAlign: "center",
          width: "100%", minHeight: 40,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {isThinking ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", animation: "cat-bounce 1s infinite" }}>😺</span>
              {subtitles}
            </span>
          ) : subtitles}
        </div>
      )}

      {/* Табы */}
      <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={"btn " + (active ? "btn-primary" : "btn-ghost")}
              style={{ flex: 1, fontSize: "0.72rem", padding: "0.55rem 0.2rem", flexDirection: "column", gap: 2 }}>
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ width: "100%" }}>
        {tab === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {chatHistory.length === 0 && (
                <p style={{ color: "var(--fg-muted)", fontSize: "0.8rem", textAlign: "center" }}>
                  Поговори со мной на татарском — голосом или текстом!
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
                  думает...
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button
                onClick={handleVoiceChat}
                className={"btn " + (isRecording ? "btn-danger" : "btn-gold")}
                style={{ padding: "0.6rem", borderRadius: "50%", width: 42, height: 42, fontSize: "1.1rem", flexShrink: 0 }}
                title={isRecording ? "Остановить запись" : "Голосовой чат"}
              >
                {isRecording ? "⏹" : <Mic size={17} />}
              </button>
              <input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChat()}
                placeholder="Напиши на татарском..."
                style={{ flex: 1, minWidth: 0, padding: "0.6rem 0.8rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg)", fontSize: "0.85rem" }} />
              <button className="btn btn-primary" onClick={handleChat} style={{ padding: "0.6rem 0.8rem", flexShrink: 0 }} aria-label="Отправить">
                <Send size={15} />
              </button>
            </div>
          </div>
        )}

        {tab === "feed" && (
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", textAlign: "center", marginBottom: 8 }}>
              Ашхана: сытый кот приносит ×1.5 баллов в играх
            </p>
            {feedMsg && (
              <p className="animate-pop" style={{ fontSize: "0.78rem", fontWeight: 700, textAlign: "center", marginBottom: 8, color: "var(--gold)" }}>
                {feedMsg}
              </p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
              {FOODS.map((food) => {
                const afford = points >= food.price;
                return (
                  <button key={food.id} onClick={() => handleFeed(food)}
                    className="btn btn-ghost"
                    style={{ flexDirection: "column", padding: "0.75rem 0.4rem", fontSize: "0.72rem", opacity: afford ? 1 : 0.55 }}>
                    <span style={{ fontSize: "1.5rem" }}>{food.icon}</span>
                    <span style={{ fontWeight: 700 }}>{food.nameTt}</span>
                    <span style={{ fontSize: "0.65rem", color: "var(--fg-muted)" }}>+{food.satiety}%</span>
                    <span style={{ fontSize: "0.65rem", color: afford ? "var(--gold)" : "var(--danger)", fontWeight: 700 }}>
                      {food.price} 💰
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === "pet" && (
          <div style={{ textAlign: "center", padding: "0.5rem" }}>
            <p style={{ fontSize: "0.78rem", color: "var(--fg-muted)", marginBottom: 10 }}>
              Ласка даёт +4 опыта. Кулдаун — 10 секунд, кот тоже устаёт 😌
            </p>
            {petMsg && (
              <p className="animate-pop" style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: 10, color: "var(--gold)" }}>
                {petMsg}
              </p>
            )}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-gold" onClick={handlePet} style={{ flex: 1 }}>
                <Heart size={16} /> Погладить
              </button>
              <button className="btn btn-primary" onClick={handlePlay} style={{ flex: 1 }}>
                🎾 Играть
              </button>
            </div>
          </div>
        )}

        {tab === "dress" && (
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", textAlign: "center", marginBottom: 8 }}>
              Кибет: купи и надень — вещи хранятся в инвентаре
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {OUTFITS.map((outfit) => {
                const owned = outfit.price === 0 || shopPurchases.includes(outfit.id);
                const active = cat.outfit === outfit.id;
                return (
                  <button key={outfit.id} onClick={() => handleDress(outfit)}
                    className={"btn " + (active ? "btn-gold" : "btn-ghost")}
                    style={{ justifyContent: "space-between", padding: "0.75rem" }}>
                    <span>{outfit.icon} {outfit.name} <span style={{ color: "var(--fg-muted)", fontSize: "0.7rem" }}>{outfit.nameTt}</span></span>
                    <span style={{ fontSize: "0.75rem", color: owned ? "var(--success)" : "var(--gold)" }}>
                      {owned ? (active ? "Надето" : "Надеть") : outfit.price + " 💰"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Статистика кота */}
      <div className="card" style={{ width: "100%", display: "flex", justifyContent: "space-between", textAlign: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Сытость</div>
          <div style={{ fontWeight: 800, fontSize: "1.05rem", fontVariantNumeric: "tabular-nums" }}>{cat.hunger}%</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Уровень</div>
          <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>{cat.level}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Наряд</div>
          <div style={{ fontWeight: 800, fontSize: "0.8rem" }}>{outfitName}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.62rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Игр</div>
          <div style={{ fontWeight: 800, fontSize: "1.05rem", fontVariantNumeric: "tabular-nums" }}>{gamesPlayed}</div>
        </div>
      </div>

      {/* Советы по уходу */}
      <div className="card" style={{ width: "100%" }}>
        <div style={{ fontWeight: 800, fontSize: "0.85rem", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={15} style={{ color: "var(--gold)" }} /> Как ухаживать
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", fontSize: "0.78rem", color: "var(--fg-muted)", lineHeight: 1.45 }}>
          <div>🍲 <b style={{ color: "var(--fg)" }}>Корми в Ашхане</b> — сытость 75%+ даёт ×1.5 баллов в играх</div>
          <div>🎮 <b style={{ color: "var(--fg)" }}>Каждая игра −12%</b> — при 0% кот засыпает и играть нельзя</div>
          <div>💕 <b style={{ color: "var(--fg)" }}>Гладь кота</b> — +4 опыта за ласку, уровень растёт</div>
        </div>
      </div>

      {/* Мәкаль дня */}
      <div className="card card-gold" style={{ width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "0.65rem", color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <BookOpen size={13} /> Мәкаль көне
        </div>
        <div className="font-display" style={{ fontWeight: 700, fontSize: "0.95rem", marginTop: 6 }}>«{proverb.tt}»</div>
        <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginTop: 2 }}>{proverb.ru}</div>
      </div>
    </div>
  );
}

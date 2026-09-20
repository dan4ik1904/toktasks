"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Sparkles, Utensils, Heart, Moon, Shirt, MessageSquare, Volume2, Mic, Send, VolumeX, User, Sparkle } from "lucide-react";
import { useStore, type ChatMessage } from "@/store/use-store";
import { assistantChatApi, ttsSpeak } from "@/lib/api";
import { haptic } from "@/lib/telegram";
import { CatSprite, type CatMood } from "@/components/cat-sprite";
import { playMeow, playPurr, playMunch, playCoin, playPop, startSnoreLoop, stopSnoreLoop } from "@/lib/pet-sounds";

const OUTFITS = [
  { id: "none", name: "Обычный", icon: "🐈", cost: 0 },
  { id: "tubetey", name: "Тюбетейка", icon: "🟢", cost: 100 },
  { id: "scarf", name: "Шарфик", icon: "🧣", cost: 150 },
  { id: "glasses", name: "Очки", icon: "🕶️", cost: 200 },
  { id: "crown", name: "Корона хана", icon: "👑", cost: 500 },
];

const QUICK_PROMPTS = [
  "Ничек хәлләрегез? (Как дела?)",
  "Расскажи интересный факт о Казани",
  "Как правильно произносить букву Ә?",
  "Переведи: «Я люблю татарский язык»",
];

export default function TamagotchiCatPage() {
  const {
    points,
    petHunger,
    petHappiness,
    petEnergy,
    petOutfit,
    ownedOutfits,
    petSleeping,
    feedPet,
    petPet,
    sleepPet,
    wakePet,
    buyOutfit,
    equipOutfit,
    chatMessages,
    setChatMessages,
    muted,
    toggleMute,
  } = useStore();

  const [tab, setTab] = useState<"pet" | "wardrobe" | "chat">("pet");
  const [feedToast, setFeedToast] = useState<string | null>(null);
  const [action, setAction] = useState<"idle" | "eating" | "petted">("idle");
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const [lastFood, setLastFood] = useState<string | null>(null);
  const heartId = useRef(0);
  const actionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Чат-состояние
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const showToast = (msg: string) => {
    setFeedToast(msg);
    setTimeout(() => setFeedToast(null), 2500);
  };

  const sound = (fn: () => void) => {
    if (!muted) fn();
  };

  const flashAction = (next: "eating" | "petted", ms: number) => {
    setAction(next);
    if (actionTimer.current) clearTimeout(actionTimer.current);
    actionTimer.current = setTimeout(() => setAction("idle"), ms);
  };

  const spawnHearts = (n = 3) => {
    const fresh = Array.from({ length: n }, () => ({ id: ++heartId.current, x: 20 + Math.random() * 60 }));
    setHearts((h) => [...h.slice(-8), ...fresh]);
    setTimeout(() => {
      setHearts((h) => h.filter((x) => !fresh.some((f) => f.id === x.id)));
    }, 1200);
  };

  const mood: CatMood =
    petSleeping || petEnergy < 20 ? "sleepy" : petHunger < 30 ? "hungry" : petHappiness > 82 ? "happy" : "normal";

  // Пока кот спит — храп играет по кругу. Один канал: всё остальное заглушено.
  useEffect(() => {
    if (petSleeping && !muted) startSnoreLoop();
    else stopSnoreLoop();
    return () => stopSnoreLoop();
  }, [petSleeping, muted]);

  const handleFeed = (type: "echpochmak" | "chakchak" | "milk") => {
    haptic("medium");
    const ok = feedPet(type);
    if (ok) {
      const foods = { echpochmak: "🥟", chakchak: "🍯", milk: "🥛" };
      const names = { echpochmak: "өчпочмак 🥟", chakchak: "чак-чак 🍯", milk: "молочко 🥛" };
      setLastFood(foods[type]);
      flashAction("eating", 1600);
      sound(playMunch);
      setTimeout(() => setLastFood(null), 1100);
      showToast(`Иптәш с удовольствием съел ${names[type]}! (+сытость)`);
    } else {
      sound(playPop);
      showToast("Не хватает XP для покупки еды! Проходи уроки.");
    }
  };

  const handlePet = () => {
    haptic("light");
    petPet();
    flashAction("petted", 800);
    spawnHearts(3);
    sound(playPurr);
    showToast("Иптәш довольно мурчит! 🥰 (+счастье)");
  };

  const handleSleepToggle = () => {
    haptic("medium");
    const was = useStore.getState().petSleeping;
    if (was) {
      wakePet();
      sound(playMeow);
      showToast("Иптәш проснулся бодрым! ☀️ (+энергия)");
    } else {
      sleepPet();
      showToast("Тсс... Иптәш засыпает 😴");
    }
  };

  const handleSpriteTap = () => {
    if (petSleeping) {
      // Тап по спящему — нежно будим
      wakePet();
      sound(playMeow);
      spawnHearts(2);
      showToast("Иптәш проснулся! ☀️");
      return;
    }
    if (petEnergy < 20) {
      showToast("Иптәш слишком устал... Уложите его спать 😴");
      return;
    }
    sound(playMeow);
    handlePet();
  };

  const handleBuyOrEquip = (id: string, cost: number) => {
    haptic("medium");
    if (ownedOutfits.includes(id)) {
      equipOutfit(id);
      sound(playPop);
      showToast("Наряд надет!");
    } else {
      const ok = buyOutfit(id, cost);
      if (ok) {
        sound(playCoin);
        spawnHearts(2);
        showToast("Новый наряд куплен и надет! 🎉");
      } else {
        sound(playPop);
        showToast("Не хватает XP для покупки!");
      }
    }
  };

  // Чат с Иптәшем
  const playTts = async (text: string) => {
    if (muted) return;
    try {
      await ttsSpeak(text, "almaz");
    } catch {
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "tt-RU";
        speechSynthesis.speak(u);
      }
    }
  };

  const sendText = async (customText?: string) => {
    const text = (customText ?? input).trim();
    if (!text || isThinking) return;
    setInput("");
    haptic("light");

    const newMsgs: ChatMessage[] = [...chatMessages, { role: "user", text }];
    setChatMessages(newMsgs);
    setIsThinking(true);

    try {
      const historyForApi = newMsgs.slice(-12).map((m) => ({ role: m.role, text: m.text }));
      const ans = await assistantChatApi(text, historyForApi);
      const finalMsgs: ChatMessage[] = [...newMsgs, { role: "assistant", text: ans.reply }];
      setChatMessages(finalMsgs);
      if (!muted && ans.say) {
        void playTts(ans.say);
      }
    } catch {
      setChatMessages([
        ...newMsgs,
        { role: "assistant", text: "Рәхмәт! Һәрвакыт сөйләшергә әзер." },
      ]);
    }
    setIsThinking(false);
  };

  const handleVoice = useCallback(async () => {
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
        try {
          const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const fd = new FormData();
          fd.append("audio", blob, "audio.webm");
          const res = await fetch(base + "/api/cat/chat", { method: "POST", body: fd });
          const data = await res.json();
          const reply = data.reply || "Рәхмәт!";
          setChatMessages((prev) => [
            ...prev,
            { role: "user", text: `🎤 (${data.text || "голосовое сообщение"})` },
            { role: "assistant", text: reply },
          ]);
          if (!muted && data.say) void playTts(data.say);
        } catch {
          setChatMessages((prev) => [...prev, { role: "assistant", text: "Мяв? Не расслышал..." }]);
        }
        setIsThinking(false);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      haptic("medium");
    } catch {
      showToast("Микрофон недоступен");
    }
  }, [isRecording, muted]);

  const getOutfitBadge = () => {
    if (petOutfit === "tubetey") return "🟢 Тюбетейка";
    if (petOutfit === "scarf") return "🧣 Шарфик";
    if (petOutfit === "glasses") return "🕶️ Очки";
    if (petOutfit === "crown") return "👑 Корона хана";
    return null;
  };

  return (
    <div className="page-shell">
      {/* Шапка */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Иптәш • Питомец</h1>
          <p className="page-subtitle">Ваш личный татарский кот-компаньон</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            onClick={() => { haptic("light"); toggleMute(); }}
            className="btn btn-ghost"
            style={{ padding: "0.4rem", borderRadius: "50%" }}
            title={muted ? "Включить звук" : "Беззвучный режим"}
          >
            {muted ? <VolumeX size={18} style={{ color: "var(--danger)" }} /> : <Volume2 size={18} style={{ color: "var(--gold)" }} />}
          </button>
          <div className="badge badge-gold">💰 {points} XP</div>
        </div>
      </div>

      {/* Переключатель вкладок */}
      <div className="seg" role="tablist">
        <button role="tab" aria-selected={tab === "pet"} className={tab === "pet" ? "active" : ""} onClick={() => setTab("pet")}>
          <Heart size={14} /> Уход
        </button>
        <button role="tab" aria-selected={tab === "wardrobe"} className={tab === "wardrobe" ? "active" : ""} onClick={() => setTab("wardrobe")}>
          <Shirt size={14} /> Гардероб
        </button>
        <button role="tab" aria-selected={tab === "chat"} className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")}>
          <MessageSquare size={14} /> Разговор
        </button>
      </div>

      {/* Вкладка 1: Уход / Тамагочи */}
      {tab === "pet" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Главная сцена с котом */}
          <div className="hero-card" style={{ textAlign: "center", padding: "2rem 1rem", position: "relative" }}>
            {getOutfitBadge() && (
              <div style={{ position: "absolute", top: 12, right: 14 }}>
                <span className="badge badge-gold">{getOutfitBadge()}</span>
              </div>
            )}
            <div
              style={{
                display: "inline-block",
                cursor: "pointer",
                filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.3))",
                position: "relative",
              }}
              onClick={handleSpriteTap}
              title="Погладить Иптәша"
            >
              <CatSprite mood={mood} action={action} outfit={petOutfit} size={170} />
              {hearts.map((h) => (
                <span key={h.id} className="float-heart" style={{ left: `${h.x}%`, top: "30%" }}>
                  💛
                </span>
              ))}
              {lastFood && (
                <span className="food-fly" style={{ position: "absolute", left: "42%", top: "38%", fontSize: "2rem" }}>
                  {lastFood}
                </span>
              )}
            </div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", marginTop: 8 }}>Иптәш</div>
            <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>
              {petSleeping
                ? "Сладко спит... 💤 (тап — разбудить)"
                : mood === "sleepy"
                  ? "Хочет спать... 😴"
                  : mood === "hungry"
                    ? "Просит кушать... 🥺"
                    : mood === "happy"
                      ? "Счастлив и мурчит! 😻"
                      : "Нажми на меня — погладь! 🐾"}
            </div>

            {/* Шкалы параметров */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "1.25rem" }}>
              <div className="card" style={{ padding: "0.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--fg-muted)" }}>Сытость</div>
                <div style={{ fontWeight: 800, fontSize: "0.9rem", color: petHunger > 50 ? "var(--success)" : "var(--danger)" }}>{petHunger}%</div>
                <div className="progress-track" style={{ height: 4, marginTop: 4 }}>
                  <div className="progress-fill" style={{ width: `${petHunger}%`, background: petHunger > 50 ? "var(--success)" : "var(--danger)" }} />
                </div>
              </div>
              <div className="card" style={{ padding: "0.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--fg-muted)" }}>Счастье</div>
                <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--gold)" }}>{petHappiness}%</div>
                <div className="progress-track" style={{ height: 4, marginTop: 4 }}>
                  <div className="progress-fill progress-fill-gold" style={{ width: `${petHappiness}%` }} />
                </div>
              </div>
              <div className="card" style={{ padding: "0.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--fg-muted)" }}>Энергия</div>
                <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--accent)" }}>{petEnergy}%</div>
                <div className="progress-track" style={{ height: 4, marginTop: 4 }}>
                  <div className="progress-fill" style={{ width: `${petEnergy}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Кнопки взаимодействия */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ fontWeight: 800, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}>
                <Utensils size={16} style={{ color: "var(--gold)" }} /> Покормить
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", opacity: petSleeping ? 0.45 : 1 }}>
                <button className="btn btn-sm btn-gold" disabled={petSleeping} onClick={() => handleFeed("echpochmak")} style={{ justifyContent: "space-between" }}>
                  <span>🥟 Өчпочмак</span> <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>25 XP</span>
                </button>
                <button className="btn btn-sm btn-ghost" disabled={petSleeping} onClick={() => handleFeed("chakchak")} style={{ justifyContent: "space-between" }}>
                  <span>🍯 Чак-чак</span> <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>15 XP</span>
                </button>
                <button className="btn btn-sm btn-ghost" disabled={petSleeping} onClick={() => handleFeed("milk")} style={{ justifyContent: "space-between" }}>
                  <span>🥛 Молочко</span> <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>10 XP</span>
                </button>
              </div>
            </div>

            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ fontWeight: 800, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={16} style={{ color: "var(--accent)" }} /> Забота
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, justifyContent: "center" }}>
                <button className="btn btn-primary" disabled={petSleeping} onClick={handlePet} style={{ width: "100%" }}>
                  <Heart size={16} /> Погладить
                </button>
                <button className={petSleeping ? "btn btn-gold" : "btn btn-ghost"} onClick={handleSleepToggle} style={{ width: "100%" }}>
                  <Moon size={16} /> {petSleeping ? "Разбудить" : "Уложить спать"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Вкладка 2: Гардероб */}
      {tab === "wardrobe" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div className="card">
            <div style={{ fontWeight: 800, fontSize: "0.9rem", marginBottom: 4 }}>Гардероб Иптәша</div>
            <p style={{ fontSize: "0.78rem", color: "var(--fg-muted)" }}>Покупайте стильные аксессуары за заработанные XP.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {OUTFITS.map((item) => {
              const owned = ownedOutfits.includes(item.id);
              const equipped = petOutfit === item.id;
              const afford = points >= item.cost;

              return (
                <div key={item.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ fontSize: "2.2rem", width: 48, textAlign: "center", flexShrink: 0 }}>{item.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>{item.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--gold)", fontWeight: 700, marginTop: 2 }}>{item.cost === 0 ? "Бесплатно" : `${item.cost} XP`}</div>
                  </div>
                  {equipped ? (
                    <span className="badge badge-gold" style={{ flexShrink: 0 }}>Надето</span>
                  ) : owned ? (
                    <button className="btn btn-sm btn-ghost" onClick={() => handleBuyOrEquip(item.id, item.cost)} style={{ flexShrink: 0 }}>
                      Надеть
                    </button>
                  ) : (
                    <button
                      className={"btn btn-sm " + (afford ? "btn-gold" : "btn-ghost")}
                      disabled={!afford}
                      onClick={() => handleBuyOrEquip(item.id, item.cost)}
                      style={{ flexShrink: 0 }}
                    >
                      Купить
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Вкладка 3: Разговор / Чат */}
      {tab === "chat" && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Быстрые промпты */}
          <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto", paddingBottom: "0.2rem" }}>
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                onClick={() => sendText(qp)}
                className="btn btn-ghost btn-sm"
                style={{ whiteSpace: "nowrap", flexShrink: 0, fontSize: "0.72rem" }}
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Окно чата */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.8rem", minHeight: "45dvh", maxHeight: "55dvh", overflowY: "auto" }}>
            {chatMessages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: "0.6rem",
                  alignItems: "flex-start",
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                }}
              >
                {m.role === "assistant" && (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--gold-soft)",
                      border: "1px solid var(--gold)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.1rem",
                      flexShrink: 0,
                    }}
                  >
                    🐆
                  </div>
                )}
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "1rem",
                    background: m.role === "user" ? "var(--accent)" : "var(--surface-2)",
                    color: m.role === "user" ? "#fff" : "var(--fg)",
                    fontSize: "0.875rem",
                    lineHeight: 1.45,
                    boxShadow: "var(--card-shadow)",
                  }}
                >
                  {m.text}
                </div>
                {m.role === "assistant" && (
                  <button
                    onClick={() => playTts(m.text)}
                    className="btn btn-ghost"
                    style={{ padding: "0.3rem", borderRadius: "50%", border: "none", alignSelf: "center" }}
                    title="Озвучить"
                  >
                    <Volume2 size={14} style={{ color: "var(--fg-muted)" }} />
                  </button>
                )}
                {m.role === "user" && (
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--accent-soft)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent)",
                      flexShrink: 0,
                    }}
                  >
                    <User size={17} />
                  </div>
                )}
              </div>
            ))}
            {isThinking && (
              <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", color: "var(--fg-muted)", fontSize: "0.8rem" }}>
                <span>🐆</span> Иптәш думает...
              </div>
            )}
          </div>

          {/* Панель ввода */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              onClick={handleVoice}
              className={"btn " + (isRecording ? "btn-danger" : "btn-gold")}
              style={{ padding: "0.75rem", borderRadius: "50%", width: 48, height: 48, flexShrink: 0 }}
              title={isRecording ? "Остановить запись" : "Голосовой ввод"}
            >
              <Mic size={20} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              placeholder="Спроси Иптәша на татарском или русском..."
              style={{
                flex: 1,
                minWidth: 0,
                padding: "0.75rem 1rem",
                borderRadius: "0.9rem",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--fg)",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
            <button className="btn btn-primary" onClick={() => sendText()} style={{ padding: "0.75rem 1.1rem", flexShrink: 0 }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Тост */}
      {feedToast && (
        <div className="toast-float animate-pop">
          <Sparkle size={14} style={{ flexShrink: 0 }} /> <span>{feedToast}</span>
        </div>
      )}
    </div>
  );
}

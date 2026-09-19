"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, Send, Volume2, Sparkles, Bot, User } from "lucide-react";
import { useStore } from "@/store/use-store";

// ============================================================
// Сөйләшү: Чат с ИИ-репетитором татарского языка.
// Голосовой ввод (WAV 16kHz) + синтез речи (TTS) + GigaChat.
// Никаких котов-тамагочи — чистое обучение и разговорная практика.
// ============================================================

interface Message {
  role: "user" | "assistant";
  text: string;
}

const QUICK_PROMPTS = [
  "Ничек хәлләрегез? (Как дела?)",
  "Мин татар телен өйрәнәм (Я учу татарский)",
  "Казан турында сөйлә (Расскажи о Казани)",
  "Рәхмәт, бик зур рахмәт! (Спасибо!)",
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
  view.setUint32(32, blockAlign, true);
  view.setUint32(34, bitDepth, true);
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

export default function ChatPage() {
  const { points } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Иминлек! Син татар телендә сөйләшү үзәгендә. Мин сезнең AI-репетитор. Татарча нинди соравыгыз бар яки нәрсә турында сөйләшик?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioChunksRef = useRef<Float32Array[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playTts = async (text: string) => {
    if (!text.trim()) return;
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    try {
      const res = await fetch(base + "/api/cat/tts?text=" + encodeURIComponent(text));
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (audioRef.current) audioRef.current.pause();
        audioRef.current = new Audio(url);
        audioRef.current.play().catch(() => {});
      }
    } catch {
      console.error("TTS error");
    }
  };

  const sendText = async (textToSend?: string) => {
    const msg = (textToSend ?? input).trim();
    if (!msg) return;
    if (!textToSend) setInput("");

    const newHistory = [...messages, { role: "user" as const, text: msg }];
    setMessages(newHistory);
    setIsThinking(true);

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(base + "/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: newHistory.slice(-8).map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.say || "Рәхмәт!";
      setMessages((h) => [...h, { role: "assistant", text: reply }]);
      setTimeout(() => playTts(reply), 200);
    } catch {
      setMessages((h) => [...h, { role: "assistant", text: "Гафу итегез, сервер җавап бирми." }]);
    }
    setIsThinking(false);
  };

  const handleVoice = useCallback(async () => {
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

      if (audioChunksRef.current.length === 0) {
        setIsThinking(false);
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
        const userHeard = data.text || "🎤 Голосовое сообщение";
        const reply = data.reply || "Мяв?";

        setMessages((h) => [
          ...h,
          { role: "user", text: userHeard },
          { role: "assistant", text: reply },
        ]);
        if (data.say) {
          setTimeout(() => playTts(data.say), 300);
        }
      } catch {
        setMessages((h) => [...h, { role: "assistant", text: "Тавышны танып булмады." }]);
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
    } catch {
      alert("Микрофон недоступен");
    }
  }, [isRecording]);

  return (
    <div className="page-shell" style={{ maxWidth: 640 }}>
      {/* Шапка */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "between", width: "100%" }}>
        <div>
          <div className="badge badge-gold" style={{ marginBottom: 4 }}>
            <Sparkles size={11} /> AI-репетитор
          </div>
          <h1 className="page-title">Сөйләшү</h1>
          <p className="page-subtitle">Практика татарской речи и перевода с искусственным интеллектом</p>
        </div>
        <div className="badge badge-gold" style={{ height: "fit-content" }}>
          💰 {points}
        </div>
      </div>

      {/* Быстрые фразы */}
      <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto", paddingBottom: "0.2rem" }}>
        {QUICK_PROMPTS.map((qp, i) => (
          <button
            key={i}
            onClick={() => sendText(qp.split(" ")[0] + " " + (qp.split(" ")[1] || ""))}
            className="btn btn-ghost btn-sm"
            style={{ whiteSpace: "nowrap", flexShrink: 0, fontSize: "0.72rem" }}
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Окно чата */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.8rem", minHeight: "50dvh", maxHeight: "60dvh", overflowY: "auto" }}>
        {messages.map((m, idx) => (
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
                  color: "var(--gold)",
                  flexShrink: 0,
                }}
              >
                <Bot size={17} />
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
            <Bot size={20} style={{ color: "var(--gold)" }} /> Репетитор думает...
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
          placeholder="Напиши сообщение на татарском..."
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
  );
}

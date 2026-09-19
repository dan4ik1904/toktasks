"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Mic, Send, Square, Volume2, VolumeX } from "lucide-react";
import {
  apiConfigured,
  assistantChatApi,
  extractSay,
  stopTts,
  sttRecognize,
  toWav16kMono,
  ttsSpeak,
  type AssistantReply,
} from "@/lib/api";
import { cn } from "@/lib/utils";

/** Голос духа — тот же, что в большинстве заданий (almaz), один на всё приложение. */
const ASSISTANT_VOICE = "almaz";

interface Message {
  role: "user" | "assistant";
  text: string;
  say?: string;
}

const STARTERS = [
  "Как сказать «спасибо» по-татарски?",
  "В чём разница исәнме и исәнмесез?",
  "Составь 3 фразы для знакомства",
  "Что значит «рәхмәт»?",
];

/** Крошечный офлайн-мозг: тот же формат {reply, say}, что и у бэкенда. */
const LOCAL: [RegExp, string, string][] = [
  [
    /спасибо|рәхмәт/,
    "Рәхмәт! Зур рәхмәт! («Спасибо» — «Рәхмәт!», а вежливо — «Зур рәхмәт!».)",
    "Рәхмәт! Зур рәхмәт!",
  ],
  [
    /привет|здравствуй|исәнме|сәлам/,
    "Исәнмесез! Хәерле көн! («Здравствуйте» — «Исәнмесез!», другу — «Исәнме!», утром — «Хәерле иртә!».)",
    "Исәнмесез! Хәерле көн!",
  ],
  [
    /знаком|исемем|таныш/,
    "Минем исемем Ярдәмче! Синең исемең ничек? («Меня зовут Ярдәмче! А тебя как?» — «Шатмын!», рад знакомству!)",
    "Минем исемем Ярдәмче! Синең исемең ничек?",
  ],
  [
    /фраз|диалог|предложен/,
    "«Минем исемем …!» — «Синең исемең ничек?» — «Шатмын!» (Три фразы для знакомства. Повтори их на острове Сәлам.)",
    "Минем исемем! Синең исемең ничек? Шатмын!",
  ],
  [
    /пока|сау бул|до свидан/,
    "Сау булыгыз! («До свидания!» — другу хватит короткого «Сау бул!».)",
    "Сау булыгыз!",
  ],
];

function localAssistant(question: string): AssistantReply {
  const low = question.toLowerCase();
  for (const [re, reply, say] of LOCAL) {
    if (re.test(low)) {
      return { reply, say, lang: /[әөүҗңһ]/.test(low) ? "tt" : "ru" };
    }
  }
  const say = "Әйт әле тагын!";
  return {
    reply: `«${say}» — аңламадым. (Скажи ещё раз — не понял. Спроси, мәсәлән, «как сказать спасибо».)`,
    say,
    lang: "ru",
  };
}

const VOICE_KEY = "tatar-uku-voice";

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Исәнме! Мин Ярдәмче! Татарча да, русча да аңлыйм — сора! (Привет! Я Ярдәмче — понимаю и татарский, и русский. Спрашивай!)",
      say: "Исәнме! Мин Ярдәмче! Татарча да, русча да аңлыйм — сора!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const spokenRef = useRef(1);
  const interactedRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const online = apiConfigured();

  useEffect(() => {
    try {
      if (localStorage.getItem(VOICE_KEY) === "off") setVoiceOn(false);
    } catch {
      /* приватный режим */
    }
  }, []);

  function toggleVoice() {
    setVoiceOn((v) => {
      const next = !v;
      try {
        localStorage.setItem(VOICE_KEY, next ? "on" : "off");
      } catch {
        /* приватный режим */
      }
      if (!next) {
        stopTts();
        setSpeakingIdx(null);
      }
      return next;
    });
  }

  async function speakText(say: string, idx: number) {
    if (!voiceOn || !say) return;
    setSpeakingIdx(idx);
    setNeedsTap(false);
    const played = await ttsSpeak(say, ASSISTANT_VOICE);
    setSpeakingIdx((cur) => (cur === idx ? null : cur));
    if (!played) setNeedsTap(true);
  }

  // Обязательная озвучка каждого нового ответа духа.
  useEffect(() => {
    if (!voiceOn || !interactedRef.current) return;
    if (spokenRef.current >= messages.length) return;
    const lastIdx = messages.length - 1;
    const last = messages[lastIdx];
    spokenRef.current = messages.length;
    if (last.role === "assistant" && last.say) {
      void speakText(last.say, lastIdx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, voiceOn]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  // Ушли со страницы — тишина.
  useEffect(() => () => stopTts(), []);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;
    interactedRef.current = true;
    stopTts(); // перебиваем говорящего — как Алису
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setLoading(true);
    try {
      const hist = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
      const r = online ? await assistantChatApi(question, hist) : localAssistant(question);
      const say = r.say || extractSay(r.reply);
      setMessages((m) => [...m, { role: "assistant", text: r.reply, say }]);
    } catch {
      const fb = localAssistant(question);
      setMessages((m) => [...m, { role: "assistant", text: fb.reply, say: fb.say }]);
    } finally {
      setLoading(false);
    }
  }

  // Голосовой ввод: запись → Tatsoft STT → сразу отправляем, дух отвечает вслух.
  async function toggleRecord() {
    if (recording) {
      try {
        recorderRef.current?.stop();
      } catch {
        /* уже остановлено */
      }
      return;
    }
    stopTts(); // глушим ответ, чтобы слушать вопрос
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        setRecording(false);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        chunksRef.current = [];
        if (blob.size === 0) return;
        void toWav16kMono(blob)
          .catch(() => blob)
          .then((wav) => sttRecognize(wav))
          .then((text) => {
            if (text.trim()) void send(text.trim());
          })
          .catch(() => {
            /* не расслышали — молча ждём текст */
          });
      };
      rec.start();
      setRecording(true);
      interactedRef.current = true;
      window.setTimeout(() => {
        if (recorderRef.current === rec && rec.state !== "inactive") {
          try {
            rec.stop();
          } catch {
            /* уже остановлено */
          }
        }
      }, 8000);
    } catch {
      /* нет микрофона — остаёмся на тексте */
    }
  }

  return (
    <main className="flex w-full flex-1 flex-col gap-3 px-4 pt-4 pb-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Назад к островам"
          className="flex size-10 items-center justify-center rounded-full hover:bg-[var(--surface-2)]"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--accent)] text-white">
          <Bot className="size-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">Ярдәмче</h1>
          <p className="text-xs text-[var(--muted)]">
            {online ? "онлайн · татарча + русча" : "офлайн-режим · без сервера"}
            {voiceOn ? " · 🔊" : " · без звука"}
          </p>
        </div>
        <button
          onClick={toggleVoice}
          aria-label={voiceOn ? "Выключить озвучку" : "Включить озвучку"}
          aria-pressed={voiceOn}
          className={cn(
            "flex size-10 items-center justify-center rounded-full border",
            voiceOn
              ? "border-[var(--accent)]/50 bg-[var(--accent-soft)] text-[var(--accent)]"
              : "border-[var(--line)] text-[var(--muted)]",
          )}
        >
          {voiceOn ? (
            <Volume2 className="size-5" aria-hidden />
          ) : (
            <VolumeX className="size-5" aria-hidden />
          )}
        </button>
      </div>

      {needsTap && voiceOn && (
        <p className="rounded-xl border border-[var(--gold)]/50 bg-[var(--gold-soft)] px-3 py-2 text-xs">
          🔊 Браузер запретил автозвук — нажми на значок динамика у ответа, и
          Ярдәмче заговорит.
        </p>
      )}

      <div className="flex flex-1 flex-col gap-2" aria-live="polite">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div
              key={i}
              className="max-w-[85%] self-end rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm text-white whitespace-pre-wrap"
            >
              {m.text}
            </div>
          ) : (
            <div
              key={i}
              className="flex max-w-[92%] items-start gap-2 self-start rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3"
            >
              <p className="flex-1 text-sm whitespace-pre-wrap">{m.text}</p>
              {m.say && (
                <button
                  onClick={() => void speakText(m.say!, i)}
                  aria-label="Озвучить ответ"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]",
                    speakingIdx === i && "animate-pulse",
                  )}
                >
                  <Volume2 className="size-4" aria-hidden />
                </button>
              )}
            </div>
          ),
        )}
        {loading && (
          <div className="max-w-[85%] self-start rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--muted)]">
            Ярдәмче яза…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-2">
        {STARTERS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-2)]"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <button
          type="button"
          onClick={toggleRecord}
          aria-label={recording ? "Остановить запись" : "Спросить голосом"}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white",
            recording ? "animate-pulse bg-[var(--terracotta)]" : "bg-[var(--accent)]",
          )}
        >
          {recording ? (
            <Square className="size-4" aria-hidden />
          ) : (
            <Mic className="size-4" aria-hidden />
          )}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            recording ? "Тыңлыйм… говори!" : "Спроси по-татарски или по-русски…"
          }
          className="h-11 min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          aria-label="Отправить"
          disabled={loading}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white disabled:opacity-50"
        >
          <Send className="size-4" aria-hidden />
        </button>
      </form>
    </main>
  );
}

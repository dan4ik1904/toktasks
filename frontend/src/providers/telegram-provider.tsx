"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@telegram-apps/types";

export interface TelegramContextValue {
  user: User | undefined;
  initDataRaw: string | undefined;
  isInTelegram: boolean;
  isDark: boolean;
}

const TelegramContext = createContext<TelegramContextValue>({
  user: undefined,
  initDataRaw: undefined,
  isInTelegram: false,
  isDark: true,
});

function detectTelegram(): { inTelegram: boolean; user?: User; raw?: string } {
  if (typeof window === "undefined") return { inTelegram: false };
  try {
    const w = window as unknown as Record<string, unknown>;
    const tg = w.Telegram as Record<string, unknown> | undefined;
    const webapp = tg?.WebApp as Record<string, unknown> | undefined;
    if (!webapp) return { inTelegram: false };
    const unsafe = webapp.initDataUnsafe as Record<string, unknown> | undefined;
    const raw = unsafe?.query ? String(unsafe.query) : "";
    const userData = unsafe?.user as User | undefined;
    return { inTelegram: true, user: userData, raw: raw || undefined };
  } catch {
    return { inTelegram: false };
  }
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<TelegramContextValue>({
    user: undefined,
    initDataRaw: undefined,
    isInTelegram: false,
    isDark: true,
  });

  useEffect(() => {
    const { inTelegram, user, raw } = detectTelegram();
    setCtx({
      user,
      initDataRaw: raw,
      isInTelegram: inTelegram,
      isDark: inTelegram ? true : window.matchMedia("(prefers-color-scheme: dark)").matches,
    });
  }, []);

  return (
    <TelegramContext.Provider value={ctx}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram(): TelegramContextValue {
  return useContext(TelegramContext);
}

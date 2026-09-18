"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  init,
  initData,
  miniApp,
  themeParams,
  useSignal,
  viewport,
} from "@telegram-apps/sdk-react";
import type { User } from "@telegram-apps/types";

/** Фон приложения — под него красим шапку и фон Mini App. */
const APP_BG = "#04150f";

export interface TelegramContextValue {
  /** Пользователь Telegram (undefined вне Telegram). */
  user: User | undefined;
  /** Сырой initData для подписи запросов к бэкенду. */
  initDataRaw: string | undefined;
  /** True, если открыто внутри Telegram. */
  isInTelegram: boolean;
  /** Тёмная ли тема (вне Telegram — true, приложение тёмное). */
  isDark: boolean;
}

const TelegramContext = createContext<TelegramContextValue>({
  user: undefined,
  initDataRaw: undefined,
  isInTelegram: false,
  isDark: true,
});

function initSdk(): boolean {
  try {
    init();

    if (miniApp.mountSync.isAvailable()) miniApp.mountSync();
    if (themeParams.mountSync.isAvailable()) themeParams.mountSync();

    // Переменные --tg-theme-* для CSS.
    if (themeParams.bindCssVars.isAvailable()) themeParams.bindCssVars();
    if (miniApp.bindCssVars.isAvailable()) miniApp.bindCssVars();

    try {
      initData.restore();
    } catch {
      /* initData необязателен */
    }

    if (viewport.mount.isAvailable()) {
      viewport.mount().catch(() => {
        /* viewport не критичен */
      });
    }

    // Тёмная тема: красим нативные панели под фон приложения.
    if (miniApp.setHeaderColor.isAvailable()) miniApp.setHeaderColor(APP_BG);
    if (miniApp.setBackgroundColor.isAvailable()) {
      miniApp.setBackgroundColor(APP_BG);
    }

    if (miniApp.ready.isAvailable()) miniApp.ready();
    return true;
  } catch {
    // Обычный браузер — работаем без SDK.
    return false;
  }
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [isInTelegram, setIsInTelegram] = useState(false);
  const user = useSignal(initData.user);
  const initDataRaw = useSignal(initData.raw);
  const tgIsDark = useSignal(themeParams.isDark);

  useEffect(() => {
    setIsInTelegram(initSdk());
  }, []);

  const value = useMemo<TelegramContextValue>(
    () => ({
      user,
      initDataRaw,
      isInTelegram,
      isDark: isInTelegram ? tgIsDark : true,
    }),
    [user, initDataRaw, isInTelegram, tgIsDark],
  );

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}

/** Доступ к пользователю и окружению Telegram из любого компонента. */
export function useTelegram(): TelegramContextValue {
  return useContext(TelegramContext);
}

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@telegram-apps/types";
import { registerApi } from "@/lib/api";
import { useProgress } from "@/store/use-progress";

const APP_BG_FALLBACK = "#f3eee2";

function appBg(): string {
  try {
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    return bg || APP_BG_FALLBACK;
  } catch {
    return APP_BG_FALLBACK;
  }
}

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
    const tg = (window as unknown as Record<string, unknown>)?.Telegram as Record<string, unknown> | undefined;
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

function initTelegramSdk(): void {
  try {
    const sdk = require("@telegram-apps/sdk-react");
    sdk.init();
    if (sdk.miniApp?.mountSync?.isAvailable()) sdk.miniApp.mountSync();
    if (sdk.themeParams?.mountSync?.isAvailable()) sdk.themeParams.mountSync();
    if (sdk.themeParams?.bindCssVars?.isAvailable()) sdk.themeParams.bindCssVars();
    if (sdk.miniApp?.bindCssVars?.isAvailable()) sdk.miniApp.bindCssVars();
    try { sdk.initData?.restore?.(); } catch { /* optional */ }
    if (sdk.viewport?.mount?.isAvailable()) {
      sdk.viewport.mount().catch(() => {});
    }
    if (sdk.miniApp?.setHeaderColor?.isAvailable()) sdk.miniApp.setHeaderColor(appBg());
    if (sdk.miniApp?.setBackgroundColor?.isAvailable()) sdk.miniApp.setBackgroundColor(appBg());
    if (sdk.miniApp?.ready?.isAvailable()) sdk.miniApp.ready();
  } catch {
    /* Not in Telegram */
  }
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<TelegramContextValue>({
    user: undefined,
    initDataRaw: undefined,
    isInTelegram: false,
    isDark: true,
  });
  const applyServer = useProgress((s) => s.applyServer);
  const registered = useRef(false);

  useEffect(() => {
    const { inTelegram, user, raw } = detectTelegram();
    if (inTelegram) initTelegramSdk();
    setCtx({
      user,
      initDataRaw: raw,
      isInTelegram: inTelegram,
      isDark: inTelegram ? true : true,
    });
  }, []);

  useEffect(() => {
    if (registered.current) return;
    registered.current = true;
    const tgId = ctx.user?.id !== undefined ? String(ctx.user.id) : "demo";
    void registerApi(tgId, ctx.user?.first_name ?? "", ctx.user?.username ?? "", ctx.initDataRaw).then(
      (p) => {
        if (p) applyServer(tgId, p);
      },
    );
  }, [ctx.isInTelegram, ctx.user, ctx.initDataRaw, applyServer]);

  return (
    <TelegramContext.Provider value={ctx}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram(): TelegramContextValue {
  return useContext(TelegramContext);
}

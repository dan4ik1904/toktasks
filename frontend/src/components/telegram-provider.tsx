"use client";

import { useEffect, useState, type ReactNode } from "react";
import { init, miniApp, themeParams, viewport } from "@telegram-apps/sdk-react";

function initTelegram() {
  try {
    init();
    miniApp.mount();
    themeParams.mount();
    miniApp.ready();
    // Viewport расширяем, если доступен.
    try {
      if (viewport.mount.isAvailable()) {
        viewport.mount();
        if (viewport.bindCssVars.isAvailable()) viewport.bindCssVars();
        if (viewport.expand.isAvailable()) viewport.expand();
      }
    } catch {
      /* viewport не критичен */
    }
    if (miniApp.bindCssVars.isAvailable()) miniApp.bindCssVars();
    if (themeParams.bindCssVars.isAvailable()) themeParams.bindCssVars();
  } catch {
    // Не в Telegram — обычный браузер, работаем как веб-страница.
  }
}

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initTelegram();
    setReady(true);
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}

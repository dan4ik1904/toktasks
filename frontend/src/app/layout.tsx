import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { TelegramProvider } from "@/providers/telegram-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { TabBar } from "@/components/tab-bar";

export const metadata: Metadata = {
  title: "TATARCHA — учим татарский с котом",
  description:
    "Telegram Web App для изучения татарского языка: задания, мини-игры, AI-кот и магазин наград.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tt" data-theme="dark" className="h-full antialiased">
      <body className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <TelegramProvider>
          <ThemeProvider>
            <div className="ornament-bg" />
            <div className="relative z-[1] flex flex-1 flex-col">{children}</div>
            <TabBar />
          </ThemeProvider>
        </TelegramProvider>
      </body>
    </html>
  );
}

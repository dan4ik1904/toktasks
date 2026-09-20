import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { TelegramProvider } from "@/providers/telegram-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { TabBar } from "@/components/tab-bar";
import { ClientInitializer } from "@/components/client-initializer";

export const metadata: Metadata = {
  title: "TATARCHA — Татарча өйрәнәбез (TatarLearn)",
  description:
    "Telegram Web App для изучения татарского языка с ИИ-ассистентом Ак Барс и древом уроков.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tt" data-theme="dark" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Unbounded:wght@500;700;800&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Unbounded:wght@500;700;800&display=swap"
          media="all"
        />
      </head>
      <body className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <TelegramProvider>
          <ThemeProvider>
            <ClientInitializer />
            <div className="mesh-bg" aria-hidden="true" />
            <div className="ornament-bg" aria-hidden="true" />
            <div className="relative z-[1] flex flex-1 flex-col">{children}</div>
            <TabBar />
          </ThemeProvider>
        </TelegramProvider>
      </body>
    </html>
  );
}
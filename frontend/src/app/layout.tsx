import type { Metadata } from "next";
import "./globals.css";
import { TelegramProvider } from "@/components/telegram-provider";
import { AppHeader } from "@/components/app-header";

export const metadata: Metadata = {
  title: "Татар.Уку — учим татарский островами",
  description:
    "Telegram Web App для изучения татарского языка: острова тем, карточки слов и ИИ-помощник Ярдәмче.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tt" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <TelegramProvider>
          <AppHeader />
          <div className="flex flex-1 flex-col">{children}</div>
        </TelegramProvider>
      </body>
    </html>
  );
}

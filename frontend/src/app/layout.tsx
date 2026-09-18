import type { Metadata } from "next";
import "./globals.css";
import { TelegramProvider } from "@/providers/telegram-provider";
import { TabBar } from "@/components/tab-bar";

export const metadata: Metadata = {
  title: "Татар.Уку — учим татарский островами",
  description:
    "Telegram Web App для изучения татарского языка: острова тем, духи-хранители и ИИ-помощник Ярдәмче.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tt" className="h-full antialiased">
      <body className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <TelegramProvider>
          <div className="flex flex-1 flex-col pb-24">{children}</div>
          <TabBar />
        </TelegramProvider>
      </body>
    </html>
  );
}

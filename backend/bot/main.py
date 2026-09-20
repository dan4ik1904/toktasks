"""Telegram-бот TATARCHA (aiogram 3.x, polling).

Команды:
  /start — приветствие + кнопка WebApp
  /help  — что умеет бот
"""

import asyncio
import logging
import sys

sys.path.insert(0, ".")  # запуск из backend/: python -m bot.main

from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandStart
from aiogram.types import (
    BotCommand,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    MenuButtonWebApp,
    Message,
    WebAppInfo,
)

from config import settings

dp = Dispatcher()


def webapp_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🐆 Открыть TATARCHA",
                    web_app=WebAppInfo(url=settings.webapp_url),
                )
            ]
        ]
    )


@dp.message(CommandStart())
async def cmd_start(message: Message) -> None:
    await message.answer(
        "Исәнме! 👋\n\n"
        "TATARCHA — интерактивное приложение для изучения татарского языка с ИИ-репетитором Иптәш.\n\n"
        "Жми кнопку ниже и начни обучение!",
        reply_markup=webapp_keyboard(),
    )


@dp.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer(
        "Я бот приложения TATARCHA.\n\n"
        "/start — открыть мини-приложение\n"
        "/help — это сообщение\n\n"
        "Внутри: древо уроков, мини-игры, ИИ-помощник Иптәш и скидки в ресторане «Тюбетей».",
        reply_markup=webapp_keyboard(),
    )


@dp.message(F.text)
async def fallback(message: Message) -> None:
    await message.answer(
        "Уроки живут в мини-приложении — открывай и учи татарский! 👇",
        reply_markup=webapp_keyboard(),
    )


async def main() -> None:
    if not settings.bot_token:
        raise SystemExit("BOT_TOKEN не задан. Скопируй backend/.env.example в backend/.env и заполни.")
    logging.basicConfig(level=logging.INFO)
    bot = Bot(
        token=settings.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    
    # Устанавливаем меню команд и кнопку Меню (Mini App)
    try:
        await bot.set_my_commands([
            BotCommand(command="start", description="Запустить TATARCHA"),
            BotCommand(command="help", description="Справка о боте")
        ])
        await bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(
                text="Открыть ТВА",
                web_app=WebAppInfo(url=settings.webapp_url)
            )
        )
    except Exception as e:
        logging.warning(f"Could not set bot menu button: {e}")

    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())

"""Telegram-бот «Татар.Уку» (aiogram 3.x, polling).

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
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
    WebAppInfo,
)

from app.config import settings

dp = Dispatcher()


def webapp_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🏝 Открыть Татар.Уку",
                    web_app=WebAppInfo(url=settings.webapp_url),
                )
            ]
        ]
    )


@dp.message(CommandStart())
async def cmd_start(message: Message) -> None:
    await message.answer(
        "Исәнме! 👋\n\n"
        "«Татар.Уку» — учим татарский островами тем: "
        "приветствия, числа, семья, еда и не только.\n\n"
        "Жми кнопку и начни с острова Сәлам!",
        reply_markup=webapp_keyboard(),
    )


@dp.message(Command("help"))
async def cmd_help(message: Message) -> None:
    await message.answer(
        "Я бот приложения «Татар.Уку».\n\n"
        "/start — открыть мини-приложение\n"
        "/help — это сообщение\n\n"
        "Внутри: острова тем, карточки слов с озвучкой "
        "и ИИ-помощник Ярдәмче.",
        reply_markup=webapp_keyboard(),
    )


@dp.message(F.text)
async def fallback(message: Message) -> None:
    await message.answer(
        "Уроки живут в мини-приложении — открывай и учи! 👇",
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
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())

"""Конфигурация: переменные окружения / backend/.env."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    bot_token: str = ""
    webapp_url: str = "https://t.me/your_bot/app"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    # LLM для Ярдәмче (необязательно — без него офлайн-режим).
    llm_api_key: str = ""
    llm_base_url: str = "https://api.openai.com/v1"
    llm_model: str = "gpt-4o-mini"

    # Tatsoft: ключи и адреса задаются здесь. Без них STT/TTS отвечают
    # 503, а перевод работает по встроенному словарю островов.
    tatsoft_api_key: str = ""
    tatsoft_base_url: str = ""
    # Пути на стороне Tatsoft — уточни по их документации и при
    # необходимости переопредели через .env.
    tatsoft_stt_path: str = "/stt"
    tatsoft_tts_path: str = "/tts"
    tatsoft_translate_path: str = "/translate"

    progress_file: str = "data/progress.json"


settings = Settings()

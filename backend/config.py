"""Конфигурация: переменные окружения / backend/.env."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    bot_token: str = ""
    webapp_url: str = "https://t.me/your_bot/app"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    # LLM-судья произношения. По умолчанию — локальная Ollama
    # (офлайн, без геоблока): ollama pull qwen2.5 && ollama serve.
    # Переключается тремя строками .env на любой OpenAI-совместимый API.
    llm_api_key: str = "ollama"
    llm_base_url: str = "http://localhost:11434/v1"
    llm_model: str = "qwen2.5"

    # Tatsoft — реальные публичные ручки (проверены живьём):
    #   TTS:      GET {base}/listening/?speaker=alsu&text=... -> {wav_base64, sample_rate}
    #   STT:      POST {stt}/listening/ files={file: wav} -> {text} | {r:[{response:[{text}]}]}
    #   Перевод:  GET {translate}/translate?lang=0&text=... (0: ru->tt, 1: tt->ru)
    # Ключ не требуется; токен оставлен на случай платного тарифа.
    tatsoft_api_key: str = ""
    tatsoft_tts_base: str = "https://tat-tts.api.translate.tatar"
    tatsoft_tts_speaker: str = "alsu"
    tatsoft_stt_base: str = "https://tat-asr.api.translate.tatar"
    tatsoft_translate_base: str = "https://translate.tatar"

    progress_file: str = "data/progress.json"
    db_file: str = "data/app.db"

    jwt_secret: str = "tatar-uku-secret-change-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 720  # 30 days


settings = Settings()

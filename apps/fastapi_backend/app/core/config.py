# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # Carga variables desde un archivo .env
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    DATABASE_URL: str = "postgresql+asyncpg://user:password@db:5432/mydatabase"
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    # OPENAI_API_KEY: str | None = None
    OAI_CONFIG_LIST: str = '[]' # JSON string para AutoGen

    # Puedes añadir más configuraciones aquí
    API_V1_STR: str = "/api/v1"

@lru_cache() # Cachea el resultado para no recargar cada vez
def get_settings() -> Settings:
    return Settings()

settings = get_settings() # Instancia global para fácil acceso
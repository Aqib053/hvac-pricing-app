from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str

    # Supabase Auth
    SUPABASE_URL: str = "https://uwbowboblsonakygaezt.supabase.co"
    SUPABASE_ANON_KEY: str = ""
    # The one email allowed to log in — set in Vercel env vars
    ALLOWED_EMAIL: str = ""

    FRONTEND_URL: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

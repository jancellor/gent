import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    api_key: str
    model: str
    base_url: str


class ConfigReader:
    def read(self) -> Config:
        config = Config(
            api_key=os.environ.get("GENT_API_KEY", "").strip(),
            model=os.environ.get("GENT_MODEL", "").strip(),
            base_url=os.environ.get("GENT_BASE_URL", "https://openrouter.ai/api/v1").strip(),
        )
        if not config.api_key:
            raise ValueError("GENT_API_KEY is not set")
        if not config.model:
            raise ValueError("GENT_MODEL is not set")
        return config

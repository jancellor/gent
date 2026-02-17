import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass(frozen=True)
class Config:
    api_key: str
    model: str
    base_url: str


class ConfigReader:
    _CONFIG_JSON_PATH = Path.home() / ".config" / "gent" / "config.json"

    def _env_or_file(self, env_key: str, file_key: str, file_values: dict[str, Any]) -> str:
        env_value = os.environ.get(env_key)
        if env_value is not None:
            return env_value.strip()
        file_value = file_values.get(file_key)
        if file_value is not None:
            return str(file_value).strip()
        raise ValueError(f"neither {env_key} or {file_key} is set")

    def _read_config_file(self) -> dict[str, Any]:
        return json.loads(self._CONFIG_JSON_PATH.read_text(encoding="utf-8"))

    def read(self) -> Config:
        try:
            file_values = self._read_config_file()
            return Config(
                api_key=self._env_or_file("GENT_API_KEY", "api_key", file_values),
                model=self._env_or_file("GENT_MODEL", "model", file_values),
                base_url=self._env_or_file("GENT_BASE_URL", "base_url", file_values),
            )
        except Exception as e:
            raise ValueError("error reading config") from e

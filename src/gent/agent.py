from typing import Any

from litellm import completion

from .cli import Cli
from .config_reader import Config
from .tools import Tools


class Agent:
    def __init__(self, config: Config, system_prompt: str, cli: Cli) -> None:
        self.model = config.model
        self.api_key = config.api_key
        self.base_url = config.base_url
        self.cli = cli
        self.tools = Tools()
        self.messages: list[dict[str, Any]] = [{"role": "system", "content": system_prompt}]

    def run(self) -> None:
        while True:
            input_event = self.cli.read_input()
            if input_event.kind == "quit":
                return

            self._run_turn(input_event.text)

    def _run_turn(self, user_text: str) -> None:
        self.messages.append({"role": "user", "content": user_text})

        while True:
            response = completion(
                model=self.model,
                api_key=self.api_key,
                api_base=self.base_url,
                messages=self.messages,
                tools=self.tools.definitions(),
                tool_choice="auto",
            )
            assistant_message = response.choices[0].message
            tool_calls = assistant_message.tool_calls

            self.messages.append(assistant_message)

            if not tool_calls:
                self.cli.write_assistant(assistant_message.content or "")
                return

            self.tools.handle_tool_calls(
                tool_calls,
                self.messages,
                cli=self.cli,
            )

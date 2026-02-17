import json
from dataclasses import dataclass
from typing import Literal

try:
    import readline  # Enables line editing/history for input() on Unix.
except Exception:
    readline = None


@dataclass(frozen=True)
class InputEvent:
    kind: Literal["text", "quit"]
    text: str = ""


class Cli:
    def read_input(self) -> InputEvent:
        print("<<< USER >>>")
        print()
        try:
            user_text = input()
        except EOFError:
            print()
            return InputEvent(kind="quit")
        print()

        user_text = user_text.strip()

        if user_text.lower() in {"exit", "quit"}:
            return InputEvent(kind="quit")

        return InputEvent(kind="text", text=user_text)

    def write_tool_start(self, command: str) -> None:
        print("<<< COMMAND >>>")
        print()
        print(command)
        print()

    def write_tool_result(self, command: str, output: str) -> None:
        _ = command
        try:
            parsed_output = json.loads(output)
            combined_output = f"{parsed_output.get('stdout', '')}{parsed_output.get('stderr', '')}"
            exit_code = parsed_output.get("exit_code", "unknown")
        except json.JSONDecodeError:
            combined_output = output
            exit_code = "unknown"

        print(combined_output, end="" if combined_output.endswith("\n") else "\n")
        print()
        print(f"Exit code: {exit_code}")
        print()

    def write_assistant(self, text: str) -> None:
        print("ASSISTANT -------")
        print()
        print(text)
        print()

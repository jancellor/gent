import json
from typing import Any, Protocol

from .run_command_tool import RunCommandTool


class Tool(Protocol):
    name: str

    def tool_definition(self) -> dict[str, Any]: ...
    def format_call(self, args: dict[str, Any]) -> str: ...
    def execute_from_args(self, args: dict[str, Any]) -> str: ...


class Tools:
    def __init__(self) -> None:
        self.tools: list[Tool] = [RunCommandTool()]

    def definitions(self) -> list[dict[str, Any]]:
        return [tool.tool_definition() for tool in self.tools]

    def _find_tool(self, name: str) -> Tool | None:
        for tool in self.tools:
            if tool.name == name:
                return tool
        return None

    def _parse_args(self, args: str) -> dict[str, Any]:
        try:
            parsed = json.loads(args)
        except json.JSONDecodeError:
            return {}
        return parsed if isinstance(parsed, dict) else {}

    def handle_tool_calls(
        self,
        tool_calls: list[Any],
        messages: list[dict[str, Any]],
        cli: Any,
    ) -> None:
        for tool_call in tool_calls:
            name = tool_call.function.name
            raw_args = tool_call.function.arguments or "{}"
            args = self._parse_args(raw_args)
            tool = self._find_tool(name)
            if tool is None:
                display_text = json.dumps(args)
                output = f'{{"error": "Unknown tool: {name}"}}'
            else:
                display_text = tool.format_call(args)
                cli.write_tool_start(display_text)
                output = tool.execute_from_args(args)
                cli.write_tool_result(display_text, output)

            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": output,
                }
            )

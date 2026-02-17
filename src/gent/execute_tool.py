import json
import subprocess
from typing import Any


class ExecuteTool:
    name = "execute"

    def tool_definition(self) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": "Execute a shell command in bash and return stdout/stderr/exit code.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "command": {
                            "type": "string",
                            "description": "The bash command to execute, ie `bash -c <COMMAND>`",
                        }
                    },
                    "required": ["command"],
                    "additionalProperties": False,
                },
            },
        }

    def extract_command(self, args: dict[str, Any]) -> str:
        command = args.get("command", "")
        return command if isinstance(command, str) else ""

    def execute(self, command: str) -> str:
        proc = subprocess.run(
            ["bash", "-c", command],
            capture_output=True,
            text=True,
        )
        result = {
            "exit_code": proc.returncode,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
        }
        return json.dumps(result)

    def format_call(self, args: dict[str, Any]) -> str:
        return self.extract_command(args)

    def execute_from_args(self, args: dict[str, Any]) -> str:
        command = self.extract_command(args)
        return self.execute(command)

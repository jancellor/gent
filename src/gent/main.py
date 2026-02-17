import sys

from .agent import Agent
from .cli import Cli
from .config_reader import ConfigReader
from .litellm_compat import apply_openrouter_reasoning_workaround
from .system_prompt import SystemPrompt

def main() -> None:
    try:
        apply_openrouter_reasoning_workaround()
        config_reader = ConfigReader()
        system_prompt = SystemPrompt()
        config = config_reader.read()
        cli = Cli()
        agent = Agent(config=config, system_prompt=system_prompt.build(), cli=cli)
        agent.run()
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()

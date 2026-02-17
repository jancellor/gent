# gent

A tiny LiteLLM-based CLI agent with one tool (`run_command`) that runs commands in bash.

## Run

Set:
- `GENT_API_KEY`
- `GENT_MODEL`
- `GENT_BASE_URL` (optional, defaults to `https://openrouter.ai/api/v1`)

```bash
uv run gent
```

Type messages at the `USER --------` prompt block. Use `exit` or `quit` to leave.

## Simpletest

`simpletest` uses:
- `GENT_API_KEY`
- `GENT_MODEL`
- `GENT_BASE_URL` (optional, defaults to `https://openrouter.ai/api/v1`)

```bash
uv run simpletest
```

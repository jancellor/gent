# gent

`gent` is a minimal proof-of-concept general-purpose agent.

It is intentionally simple and exposes exactly one tool: `bash` command execution (via `execute`).

## Run

Set:
- `GENT_API_KEY`
- `GENT_MODEL`
- `GENT_BASE_URL`

`gent` also reads a JSON config file at `~/.config/gent/config.json`.
Use lowercase keys in that file: `api_key`, `model`, `base_url`.
If both are set, environment variables take precedence over values in `config.json`.

```bash
uv run gent
```

Type messages at the `USER --------` prompt block. Use `exit` or `quit` to leave.

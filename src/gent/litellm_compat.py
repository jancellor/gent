import litellm
from litellm.llms.openai.chat.gpt_transformation import OpenAIGPTConfig
from litellm.llms.openrouter.chat.transformation import OpenrouterConfig


def apply_openrouter_reasoning_workaround() -> None:
    # Workaround for LiteLLM OpenRouter reasoning-capability checks that call
    # supports_reasoning() with provider-stripped models (e.g. "qwen/qwen3-coder"),
    # which triggers noisy "Provider List" stderr output in current versions.
    #
    # Remove this when upstream no longer calls supports_reasoning(model=model)
    # without custom_llm_provider="openrouter" in OpenrouterConfig.
    # Track: https://github.com/BerriAI/litellm/issues/14984
    # Local verification before removing:
    # 1) run `uv run gent`
    # 2) confirm there are no "Provider List: https://docs.litellm.ai/docs/providers"
    #    lines on stderr.
    if getattr(OpenrouterConfig, "_gent_reasoning_patch_applied", False):
        return

    def _patched_get_supported_openai_params(self: OpenrouterConfig, model: str) -> list:
        supported_params = OpenAIGPTConfig.get_supported_openai_params(self, model=model)
        try:
            if litellm.supports_reasoning(
                model=model, custom_llm_provider="openrouter"
            ):
                supported_params.append("reasoning_effort")
                supported_params.append("thinking")
        except Exception:
            pass
        return list(dict.fromkeys(supported_params))

    OpenrouterConfig.get_supported_openai_params = _patched_get_supported_openai_params
    OpenrouterConfig._gent_reasoning_patch_applied = True

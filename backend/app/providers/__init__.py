from app.providers.anthropic import AnthropicAdapter
from app.providers.base import ProviderAdapter
from app.providers.custom import CustomAdapter
from app.providers.google import GoogleAdapter
from app.providers.openai import OpenAIAdapter
from app.providers.openrouter import OpenRouterAdapter
from app.providers.xai import XAIAdapter

_REGISTRY: dict[str, ProviderAdapter] = {
    "anthropic": AnthropicAdapter(),
    "openai": OpenAIAdapter(),
    "google": GoogleAdapter(),
    "xai": XAIAdapter(),
    "openrouter": OpenRouterAdapter(),
    "custom": CustomAdapter(),
}


def get_provider(provider_id: str) -> ProviderAdapter:
    adapter = _REGISTRY.get(provider_id)
    if not adapter:
        raise ValueError(f"Unknown provider: {provider_id}")
    return adapter

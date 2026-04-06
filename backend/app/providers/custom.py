from __future__ import annotations

from app.providers.openai import OpenAIAdapter
from app.schemas import ChatRequest


class CustomAdapter(OpenAIAdapter):
    """Adapter for arbitrary OpenAI-compatible endpoints (DeepInfra, Together, Groq, Ollama, etc.)."""

    def build_url(self, req: ChatRequest) -> str:
        base = (req.base_url or "").rstrip("/")
        # Append /chat/completions if not already present
        if not base.endswith("/chat/completions"):
            base = f"{base}/chat/completions"
        return base

    def build_messages(self, req: ChatRequest) -> list[dict]:
        return [{"role": msg.role, "content": msg.content} for msg in req.messages]

    def build_request(self, req: ChatRequest) -> tuple[str, dict, dict, dict]:
        body: dict = {
            "model": req.model,
            "messages": self.build_messages(req),
            "max_tokens": req.max_tokens,
        }
        if req.stream:
            body["stream"] = True
            body["stream_options"] = {"include_usage": True}

        # Pass through reasoning_effort if the model supports it
        if req.reasoning and req.reasoning.level:
            body["reasoning_effort"] = req.reasoning.level

        if req.temperature is not None:
            body["temperature"] = req.temperature
        if req.top_p is not None:
            body["top_p"] = req.top_p
        if req.frequency_penalty is not None:
            body["frequency_penalty"] = req.frequency_penalty
        if req.presence_penalty is not None:
            body["presence_penalty"] = req.presence_penalty

        return (self.build_url(req), self.build_headers(req), body, {})

from __future__ import annotations

from app.providers.openai import OpenAIAdapter
from app.schemas import ChatRequest


class OpenRouterAdapter(OpenAIAdapter):
    BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

    def build_url(self, req: ChatRequest) -> str:
        return self.BASE_URL

    def build_messages(self, req: ChatRequest) -> list[dict]:
        return [{"role": msg.role, "content": msg.content} for msg in req.messages]

    def build_request(self, req: ChatRequest) -> tuple[str, dict, dict, dict]:
        body: dict = {
            "model": req.model,  # e.g. "anthropic/claude-opus-4-6"
            "messages": self.build_messages(req),
            "max_tokens": req.max_tokens,
        }
        if req.stream:
            body["stream"] = True
            body["stream_options"] = {"include_usage": True}

        # Pass reasoning params through — OpenRouter routes to the underlying provider
        if req.reasoning:
            if req.reasoning.level:
                body["reasoning_effort"] = req.reasoning.level
            if req.reasoning.budget_tokens is not None:
                body["reasoning"] = {"budget_tokens": req.reasoning.budget_tokens}

        if req.temperature is not None:
            body["temperature"] = req.temperature
        if req.top_p is not None:
            body["top_p"] = req.top_p
        if req.frequency_penalty is not None:
            body["frequency_penalty"] = req.frequency_penalty
        if req.presence_penalty is not None:
            body["presence_penalty"] = req.presence_penalty

        return (self.build_url(req), self.build_headers(req), body, {})

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class ReasoningConfig(BaseModel):
    """Reasoning parameters. The adapter interprets whichever field applies."""

    level: str | None = None  # e.g. "low", "medium", "high", "max", "xhigh"
    budget_tokens: int | None = None  # continuous budget (Anthropic, Google 2.5)


class ChatRequest(BaseModel):
    provider: str  # "anthropic", "openai", "google", "xai", "openrouter", "custom"
    model: str
    messages: list[ChatMessage]
    api_key: str = ""
    reasoning: ReasoningConfig | None = None
    max_tokens: int = Field(default=4096, ge=1)
    temperature: float | None = None
    top_p: float | None = None
    frequency_penalty: float | None = None
    presence_penalty: float | None = None
    stream: bool = True
    base_url: str | None = None  # for custom providers only


class UsageInfo(BaseModel):
    input_tokens: int | None = None
    output_tokens: int | None = None


class StreamEvent(BaseModel):
    """Normalized SSE event sent to the frontend."""

    type: Literal[
        "content_start",
        "content_delta",
        "thinking_delta",
        "content_stop",
        "error",
    ]
    text: str = ""
    usage: UsageInfo | None = None


class ChatResponse(BaseModel):
    """Non-streaming response."""

    content: str
    thinking: str | None = None
    usage: UsageInfo | None = None

from __future__ import annotations

import json
from collections.abc import AsyncIterator

from httpx_sse import EventSource

from app.providers.base import ProviderAdapter
from app.schemas import ChatRequest, ChatResponse, StreamEvent, UsageInfo

ANTHROPIC_BUDGET_MAP: dict[str, int] = {
    "low": 2048,
    "medium": 8192,
    "high": 32768,
    "max": 100000,
}


class AnthropicAdapter(ProviderAdapter):
    BASE_URL = "https://api.anthropic.com/v1/messages"

    def build_request(self, req: ChatRequest) -> tuple[str, dict, dict, dict]:
        headers = {
            "x-api-key": req.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

        # Separate system messages from conversation
        system_text: str | None = None
        messages: list[dict] = []
        for msg in req.messages:
            if msg.role == "system":
                system_text = msg.content
            else:
                messages.append({"role": msg.role, "content": msg.content})

        body: dict = {
            "model": req.model,
            "messages": messages,
            "max_tokens": req.max_tokens,
        }
        if system_text:
            body["system"] = system_text
        if req.stream:
            body["stream"] = True

        # Extended thinking
        if req.reasoning and (req.reasoning.level or req.reasoning.budget_tokens):
            budget = req.reasoning.budget_tokens or ANTHROPIC_BUDGET_MAP.get(
                req.reasoning.level or "", 8192
            )
            body["thinking"] = {"type": "enabled", "budget_tokens": budget}
            # temperature must be 1 when thinking is enabled
            body["temperature"] = 1
            # Enable interleaved thinking for multi-turn
            headers["anthropic-beta"] = "interleaved-thinking-2025-05-14"
        else:
            # Only apply user temperature when thinking is not enabled
            if req.temperature is not None:
                body["temperature"] = req.temperature
        if req.top_p is not None:
            body["top_p"] = req.top_p

        return (self.BASE_URL, headers, body, {})

    async def parse_stream(self, event_source: EventSource) -> AsyncIterator[StreamEvent]:
        current_block_type: str | None = None
        usage = UsageInfo()

        async for event in event_source.aiter_sse():
            data = json.loads(event.data)
            event_type = data.get("type", "")

            if event_type == "message_start":
                msg = data.get("message", {})
                raw_usage = msg.get("usage", {})
                usage.input_tokens = raw_usage.get("input_tokens")
                yield StreamEvent(type="content_start")

            elif event_type == "content_block_start":
                block = data.get("content_block", {})
                current_block_type = block.get("type")  # "thinking" or "text"

            elif event_type == "content_block_delta":
                delta = data.get("delta", {})
                delta_type = delta.get("type", "")

                if delta_type == "thinking_delta":
                    yield StreamEvent(type="thinking_delta", text=delta.get("thinking", ""))
                elif delta_type == "text_delta":
                    yield StreamEvent(type="content_delta", text=delta.get("text", ""))

            elif event_type == "message_delta":
                raw_usage = data.get("usage", {})
                usage.output_tokens = raw_usage.get("output_tokens")

            elif event_type == "message_stop":
                yield StreamEvent(type="content_stop", usage=usage)

            elif event_type == "error":
                error = data.get("error", {})
                yield StreamEvent(type="error", text=error.get("message", "Unknown error"))

    def parse_response(self, data: dict) -> ChatResponse:
        content_parts: list[str] = []
        thinking_parts: list[str] = []

        for block in data.get("content", []):
            if block["type"] == "text":
                content_parts.append(block.get("text", ""))
            elif block["type"] == "thinking":
                thinking_parts.append(block.get("thinking", ""))

        raw_usage = data.get("usage", {})

        return ChatResponse(
            content="".join(content_parts),
            thinking="".join(thinking_parts) if thinking_parts else None,
            usage=UsageInfo(
                input_tokens=raw_usage.get("input_tokens"),
                output_tokens=raw_usage.get("output_tokens"),
            ),
        )

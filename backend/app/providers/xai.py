from __future__ import annotations

import json
from collections.abc import AsyncIterator

from httpx_sse import EventSource

from app.providers.openai import OpenAIAdapter
from app.schemas import ChatRequest, ChatResponse, StreamEvent, UsageInfo

# Only grok-3-mini variants support reasoning_effort
REASONING_EFFORT_MODELS = {"grok-3-mini", "grok-3-mini-fast"}


class XAIAdapter(OpenAIAdapter):
    BASE_URL = "https://api.x.ai/v1/chat/completions"

    def build_url(self, req: ChatRequest) -> str:
        return self.BASE_URL

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

        if req.reasoning and req.reasoning.level and req.model in REASONING_EFFORT_MODELS:
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

    async def parse_stream(self, event_source: EventSource) -> AsyncIterator[StreamEvent]:
        started = False
        usage: UsageInfo | None = None

        async for event in event_source.aiter_sse():
            if event.data == "[DONE]":
                break

            data = json.loads(event.data)

            if raw_usage := data.get("usage"):
                usage = UsageInfo(
                    input_tokens=raw_usage.get("prompt_tokens"),
                    output_tokens=raw_usage.get("completion_tokens"),
                )

            choices = data.get("choices", [])
            if not choices:
                continue

            delta = choices[0].get("delta", {})

            if not started and ("role" in delta or "content" in delta or "reasoning_content" in delta):
                started = True
                yield StreamEvent(type="content_start")

            # grok-3-mini exposes reasoning in reasoning_content
            if thinking := delta.get("reasoning_content"):
                yield StreamEvent(type="thinking_delta", text=thinking)

            if text := delta.get("content"):
                yield StreamEvent(type="content_delta", text=text)

        yield StreamEvent(type="content_stop", usage=usage)

    def parse_response(self, data: dict) -> ChatResponse:
        choice = data["choices"][0]
        message = choice["message"]
        raw_usage = data.get("usage", {})

        return ChatResponse(
            content=message.get("content", ""),
            thinking=message.get("reasoning_content"),
            usage=UsageInfo(
                input_tokens=raw_usage.get("prompt_tokens"),
                output_tokens=raw_usage.get("completion_tokens"),
            ),
        )

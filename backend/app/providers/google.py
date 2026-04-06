from __future__ import annotations

import json
from collections.abc import AsyncIterator

from httpx_sse import EventSource

from app.providers.base import ProviderAdapter
from app.schemas import ChatRequest, ChatResponse, StreamEvent, UsageInfo

# Gemini 3.x uses thinkingLevel (discrete levels)
GEMINI_3X_MODELS = {
    "gemini-3.1-pro-preview",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
}
# Gemini 2.5 uses thinkingBudget (integer token budget)
GEMINI_25_MODELS = {
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
}

BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"


class GoogleAdapter(ProviderAdapter):
    def build_request(self, req: ChatRequest) -> tuple[str, dict, dict, dict]:
        action = "streamGenerateContent" if req.stream else "generateContent"
        url = f"{BASE_URL}/{req.model}:{action}"

        query_params: dict = {"key": req.api_key}
        if req.stream:
            query_params["alt"] = "sse"

        headers = {"Content-Type": "application/json"}

        # Convert messages to Gemini format (role: "user"/"model", parts)
        system_text: str | None = None
        contents: list[dict] = []
        for msg in req.messages:
            if msg.role == "system":
                system_text = msg.content
            else:
                gemini_role = "model" if msg.role == "assistant" else "user"
                contents.append({"role": gemini_role, "parts": [{"text": msg.content}]})

        body: dict = {"contents": contents}
        if system_text:
            body["systemInstruction"] = {"parts": {"text": system_text}}

        generation_config: dict = {"maxOutputTokens": req.max_tokens}

        # Thinking config differs by model generation
        if req.reasoning:
            thinking_config: dict = {}
            if req.model in GEMINI_3X_MODELS and req.reasoning.level:
                # Gemini 3.x expects lowercase levels: minimal, low, medium, high
                thinking_config["thinkingLevel"] = req.reasoning.level.lower()
            elif req.model in GEMINI_25_MODELS and req.reasoning.budget_tokens is not None:
                thinking_config["thinkingBudget"] = req.reasoning.budget_tokens
            if thinking_config:
                generation_config["thinkingConfig"] = thinking_config

        if req.temperature is not None:
            generation_config["temperature"] = req.temperature
        if req.top_p is not None:
            generation_config["topP"] = req.top_p
        if req.frequency_penalty is not None:
            generation_config["frequencyPenalty"] = req.frequency_penalty
        if req.presence_penalty is not None:
            generation_config["presencePenalty"] = req.presence_penalty

        body["generationConfig"] = generation_config

        return (url, headers, body, query_params)

    async def parse_stream(self, event_source: EventSource) -> AsyncIterator[StreamEvent]:
        started = False
        usage: UsageInfo | None = None

        async for event in event_source.aiter_sse():
            data = json.loads(event.data)

            # Extract usage from usageMetadata
            if raw_usage := data.get("usageMetadata"):
                usage = UsageInfo(
                    input_tokens=raw_usage.get("promptTokenCount"),
                    output_tokens=raw_usage.get("candidatesTokenCount"),
                )

            candidates = data.get("candidates", [])
            if not candidates:
                continue

            content = candidates[0].get("content", {})
            parts = content.get("parts", [])

            if not started and parts:
                started = True
                yield StreamEvent(type="content_start")

            for part in parts:
                if "thought" in part:
                    # Thinking content from Gemini
                    yield StreamEvent(type="thinking_delta", text=part["thought"])
                elif "text" in part:
                    yield StreamEvent(type="content_delta", text=part["text"])

            # Check for errors
            if error := data.get("error"):
                yield StreamEvent(type="error", text=error.get("message", "Unknown error"))

        yield StreamEvent(type="content_stop", usage=usage)

    def parse_response(self, data: dict) -> ChatResponse:
        content_parts: list[str] = []
        thinking_parts: list[str] = []

        candidates = data.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            for part in parts:
                if "thought" in part:
                    thinking_parts.append(part["thought"])
                elif "text" in part:
                    content_parts.append(part["text"])

        raw_usage = data.get("usageMetadata", {})

        return ChatResponse(
            content="".join(content_parts),
            thinking="".join(thinking_parts) if thinking_parts else None,
            usage=UsageInfo(
                input_tokens=raw_usage.get("promptTokenCount"),
                output_tokens=raw_usage.get("candidatesTokenCount"),
            ),
        )

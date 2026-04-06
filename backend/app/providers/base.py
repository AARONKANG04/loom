from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator

from httpx_sse import EventSource

from app.schemas import ChatRequest, ChatResponse, StreamEvent


class ProviderAdapter(ABC):
    """Base class for all provider adapters."""

    @abstractmethod
    def build_request(self, req: ChatRequest) -> tuple[str, dict, dict, dict]:
        """Build the HTTP request for this provider.

        Returns:
            (url, headers, json_body, query_params)
        """
        ...

    @abstractmethod
    async def parse_stream(self, event_source: EventSource) -> AsyncIterator[StreamEvent]:
        """Parse the provider's SSE stream into normalized StreamEvents."""
        ...

    @abstractmethod
    def parse_response(self, data: dict) -> ChatResponse:
        """Parse a non-streaming JSON response."""
        ...

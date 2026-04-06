from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import httpx
from httpx_sse import aconnect_sse

from app.providers import get_provider
from app.schemas import ChatRequest, StreamEvent

router = APIRouter()

_TIMEOUT = httpx.Timeout(connect=10.0, read=120.0, write=10.0, pool=10.0)


@router.post("/v1/chat")
async def chat(req: ChatRequest):
    try:
        adapter = get_provider(req.provider)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    url, headers, body, params = adapter.build_request(req)

    if req.stream:
        return StreamingResponse(
            _stream_response(adapter, url, headers, body, params),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        response = await client.post(url, headers=headers, json=body, params=params)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        return adapter.parse_response(response.json())


async def _stream_response(adapter, url, headers, body, params):
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        async with aconnect_sse(
            client, "POST", url, headers=headers, json=body, params=params
        ) as event_source:
            if event_source.response.status_code != 200:
                await event_source.response.aread()
                event = StreamEvent(
                    type="error", text=event_source.response.text
                )
                yield f"data: {event.model_dump_json()}\n\n"
                return

            async for event in adapter.parse_stream(event_source):
                yield f"data: {event.model_dump_json()}\n\n"

import asyncio
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

_start_time = time.time()


def _get_status() -> dict:
    import os
    import resource

    uptime = int(time.time() - _start_time)
    mem_bytes = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss * 1024  # KB -> bytes on Linux
    pid = os.getpid()

    return {
        "status": "running",
        "uptime_seconds": uptime,
        "memory_bytes": mem_bytes,
        "pid": pid,
    }


@router.websocket("/ws/status")
async def status_ws(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            await ws.send_json(_get_status())
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass

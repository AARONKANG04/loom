from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import chat, health, status

app = FastAPI(title="Loom Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:1420",    # Vite dev server
        "tauri://localhost",        # Tauri webview (macOS)
        "http://localhost",         # Tauri webview (Linux)
        "https://tauri.localhost",  # Tauri webview (Windows)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(status.router)
app.include_router(chat.router)

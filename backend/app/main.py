import os
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.ws_pg_activity import pg_activity_handler
from app.routers.search import router as search_router

load_dotenv()

app = FastAPI(title="Portfolio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/me")
async def me():
    return {
        "name": "Emile Nikel",
        "tagline": "Software Engineer",
        "links": {
            "github": "https://github.com/emilenikel",
            "linkedin": "https://linkedin.com/in/emilenikel",
            "email": "nikel.emile@gmail.com",
        },
    }


@app.websocket("/ws/pg-activity")
async def pg_activity_endpoint(ws: WebSocket):
    await pg_activity_handler(ws)

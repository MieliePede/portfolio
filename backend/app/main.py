import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import breeds

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    task = asyncio.create_task(breeds.sync_loop())
    yield
    task.cancel()


app = FastAPI(title="Portfolio API", lifespan=lifespan)
app.include_router(breeds.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}

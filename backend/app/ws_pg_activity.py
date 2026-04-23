import asyncio
import os

import asyncpg
from fastapi import WebSocket


async def pg_activity_handler(websocket: WebSocket) -> None:
    await websocket.accept()

    url = os.getenv("DATABASE_URL")
    if not url:
        await websocket.send_json({"error": "db_unavailable"})
        await websocket.close()
        return

    pool = None
    try:
        pool = await asyncpg.create_pool(url, min_size=1, max_size=2)
        while True:
            rows = await pool.fetch("""
                SELECT
                    pid,
                    usename,
                    application_name,
                    state,
                    wait_event_type,
                    wait_event,
                    EXTRACT(EPOCH FROM (now() - query_start))::int AS duration_s,
                    left(query, 120) AS query
                FROM pg_stat_activity
                WHERE pid <> pg_backend_pid()
                ORDER BY query_start DESC NULLS LAST
                LIMIT 20
            """)
            await websocket.send_json([dict(r) for r in rows])
            await asyncio.sleep(2)
    except Exception:
        try:
            await websocket.send_json({"error": "db_unavailable"})
        except Exception:
            pass
    finally:
        if pool:
            await pool.close()
        try:
            await websocket.close()
        except Exception:
            pass

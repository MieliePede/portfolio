from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(title="Portfolio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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

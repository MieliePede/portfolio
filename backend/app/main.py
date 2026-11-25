from fastapi import FastAPI

app = FastAPI(title="Portfolio API")


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

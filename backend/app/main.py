from fastapi import FastAPI

app = FastAPI(title="DŌM Home Café OS")

@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

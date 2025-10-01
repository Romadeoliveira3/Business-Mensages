from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Application lifespan hook for startup and shutdown events."""

    # Place startup logic here (e.g., warmups, connections)
    yield
    # Place shutdown logic here (e.g., graceful cleanup)


app = FastAPI(title=settings.project_name, lifespan=lifespan)


@app.get("/", tags=["health"])
async def root() -> dict[str, str]:
    """Provide a simple readiness endpoint for the frontend to query."""

    return {"status": "ok", "message": settings.project_name}

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api import api_router
from app.core.config import settings
from app.db.migrations import run_migrations


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Application lifespan hook for startup and shutdown events."""

    run_migrations()
    yield
    # Place shutdown logic here (e.g., graceful cleanup)


app = FastAPI(title=settings.project_name, lifespan=lifespan)

app.include_router(api_router)


@app.get("/", tags=["health"])
async def root() -> dict[str, str]:
    """Provide a simple readiness endpoint for the frontend to query."""

    return {"status": "ok", "message": settings.project_name}

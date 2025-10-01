from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings


@asynccontextmanager
def lifespan(_: FastAPI):
    """Application lifespan hook for startup and shutdown events."""

    yield


app = FastAPI(title=settings.project_name, lifespan=lifespan)


@app.get("/", tags=["health"])
async def root() -> dict[str, str]:
    """Provide a simple readiness endpoint for the frontend to query."""

    return {"status": "ok", "message": settings.project_name}

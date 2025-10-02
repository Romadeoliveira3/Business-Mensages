from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import settings

# Removemos o lifespan que executava as migrations
# As migrations agora são executadas pelo script start.sh antes de iniciar o servidor

app = FastAPI(
    title=settings.project_name,
    description="API para gerenciamento de mensagens de negócio",
    version="0.1.0",
    debug=True,
)

# Enable CORS for the frontend during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/", tags=["health"])
async def root() -> dict[str, str]:
    """Provide a simple readiness endpoint for the frontend to query."""

    return {"status": "ok", "message": settings.project_name}

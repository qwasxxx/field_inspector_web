"""FastAPI application entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.domain.models  # noqa: F401 — register metadata
from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import AsyncSessionLocal, engine
from app.core.exceptions import app_exception_handler
from app.core.logging import configure_logging
from app.core.seed import run_seed
from app.domain.errors import AppException
from app.domain.models.base import Base

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Create schema and seed demo data on startup."""

    configure_logging()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        await run_seed(session)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_exception_handler(AppException, app_exception_handler)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe."""

    return {"status": "ok"}

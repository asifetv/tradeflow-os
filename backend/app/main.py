"""FastAPI application factory."""
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting TradeFlow OS API", version="0.1.0", env=settings.APP_ENV)
    yield
    # Shutdown
    logger.info("Shutting down TradeFlow OS API")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="TradeFlow OS",
        description="Production-grade oil & gas trading platform",
        version="0.1.0",
        docs_url="/docs" if settings.APP_DEBUG else None,
        redoc_url="/redoc" if settings.APP_DEBUG else None,
        lifespan=lifespan,
    )

    # CORS Middleware
    origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health check endpoint
    @app.get("/healthz")
    async def health():
        return {"status": "ok"}

    @app.get("/readyz")
    async def readiness():
        # TODO: check DB, Redis, MinIO connectivity
        return {"status": "ready"}

    # TODO: Register routers
    # app.include_router(auth_router, prefix="/api/auth")
    # app.include_router(deals_router, prefix="/api/deals")
    # etc.

    return app


# Create app instance for uvicorn
app = create_app()

"""FastAPI application factory."""
import traceback
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

from app.config import settings

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting TradeFlow OS API", version="0.1.0", env=settings.APP_ENV)

    # Create database tables on startup
    from app.database import engine, Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified")

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
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        max_age=600,
    )

    # Global exception handler to ensure CORS headers on 500 errors
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(
            "Unhandled exception",
            path=request.url.path,
            method=request.method,
            error=str(exc),
            traceback=traceback.format_exc(),
        )
        origin = request.headers.get("origin", "")
        headers = {}
        if origin in origins:
            headers = {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
            }
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc)},
            headers=headers,
        )

    # Health check endpoint - for liveness probes
    @app.get("/healthz")
    async def health():
        """Liveness probe - simple status check."""
        return {"status": "ok"}

    # Readiness check endpoint - for readiness probes
    @app.get("/readyz")
    async def readiness():
        """Readiness probe - check all service dependencies."""
        from sqlalchemy import text
        from app.database import AsyncSessionLocal

        checks = {
            "database": False,
            "minio": False,
            "status": "ready",
        }

        # Check database connectivity
        try:
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
            checks["database"] = True
        except Exception as e:
            logger.error("Database health check failed", error=str(e))
            checks["status"] = "not_ready"

        # Check MinIO connectivity
        try:
            from app.services.storage import StorageService
            storage = StorageService()
            # Simple check - list buckets (doesn't upload anything)
            await storage.client._client_session.__aenter__()
            # If we can reach MinIO, mark as healthy
            checks["minio"] = True
        except Exception as e:
            logger.warning("MinIO health check failed (optional)", error=str(e))
            # MinIO failure is not critical for readiness, log but don't fail

        # Return 503 if not ready
        if checks["status"] != "ready":
            return JSONResponse(
                status_code=503,
                content={
                    "status": "not_ready",
                    "checks": checks,
                    "message": "Service dependencies not available",
                },
            )

        return {"status": "ready", "checks": checks}

    # Add explicit CORS handling for OPTIONS requests
    @app.options("/{full_path:path}")
    async def options_handler(full_path: str):
        return {"status": "ok"}

    # Register routers
    from app.api.auth import router as auth_router
    from app.api.deals import router as deals_router
    from app.api.customers import router as customers_router
    from app.api.quotes import router as quotes_router
    from app.api.customer_pos import router as customer_pos_router
    from app.api.vendors import router as vendors_router
    from app.api.vendor_proposals import router as vendor_proposals_router
    from app.api.documents import router as documents_router
    app.include_router(auth_router)
    app.include_router(deals_router)
    app.include_router(customers_router)
    app.include_router(quotes_router)
    app.include_router(customer_pos_router)
    app.include_router(vendors_router)
    app.include_router(vendor_proposals_router)
    app.include_router(documents_router)

    return app


# Create app instance for uvicorn
app = create_app()

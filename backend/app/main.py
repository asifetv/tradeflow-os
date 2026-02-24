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

    # Health check endpoint
    @app.get("/healthz")
    async def health():
        return {"status": "ok"}

    @app.get("/readyz")
    async def readiness():
        # TODO: check DB, Redis, MinIO connectivity
        return {"status": "ready"}

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

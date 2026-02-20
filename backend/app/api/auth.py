"""Authentication API routes for registration and login."""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services.auth import AuthService
from app.database import get_db
from app.deps import get_current_user_full

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Type annotation for session dependency
SessionDep = AsyncSession


def extract_subdomain(subdomain: Optional[str] = Header(None, alias="X-Subdomain")) -> str:
    """Extract subdomain from X-Subdomain header or default to 'demo'."""
    if not subdomain:
        # Default to 'demo' if no subdomain provided
        return "demo"
    return subdomain


@router.post("/register", response_model=TokenResponse)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register new company and admin user."""
    service = AuthService(db)
    try:
        result = await service.register(data)
        await db.commit()
        return result
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        print(f"DEBUG: Registration error: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
    subdomain: str = Depends(extract_subdomain),
):
    """Login user for specific company subdomain."""
    service = AuthService(db)
    try:
        result = await service.login(data, subdomain)
        await db.commit()
        return result
    except ValueError as e:
        await db.rollback()
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Login failed")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user_full),
):
    """Get current authenticated user info."""
    # Note: This would need to fetch full user from DB in production
    # For now, returning the info from JWT token
    return {
        "id": current_user["user_id"],
        "company_id": current_user["company_id"],
        "email": current_user["email"],
        "full_name": current_user.get("full_name", ""),
        "role": current_user["role"],
        "is_active": True,
        "email_verified": True,
        "last_login_at": None,
        "created_at": None,
    }

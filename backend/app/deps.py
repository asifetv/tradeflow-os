"""FastAPI dependencies."""
from typing import Annotated, Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status, Header
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db
from app.models.user import User

# Type annotation for database session
SessionDep = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user_full(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Extract and validate JWT token, return user dict with company_id.

    Returns:
        {
            "user_id": UUID,
            "company_id": UUID,
            "email": str,
            "role": str,
        }
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Parse Bearer token
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
            )

        # Decode JWT
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

        user_id_str: str = payload.get("sub")
        company_id_str: str = payload.get("company_id")
        email: str = payload.get("email")

        if not user_id_str or not company_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        user_id = UUID(user_id_str)
        company_id = UUID(company_id_str)

        # Verify user still exists and is active
        result = await db.execute(
            select(User).where(
                (User.id == user_id)
                & (User.company_id == company_id)
                & (User.is_active == True)
            )
        )
        user = result.scalars().first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )

        return {
            "user_id": user_id,
            "company_id": company_id,
            "email": email,
            "role": user.role,
        }

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
        )


# Legacy alias for backward compatibility during migration
async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """Legacy function - returns 'test-user' for testing. Use get_current_user_full for new code."""
    if not authorization:
        return "test-user"

    try:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() != "bearer":
            return "test-user"

        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return "test-user"
        return user_id
    except JWTError:
        return "test-user"


def require_permission(permission: str):
    """RBAC dependency factory."""

    async def dependency(current_user: dict = Depends(get_current_user_full)):
        # TODO: implement RBAC check
        return current_user

    return dependency


# Common dependencies
CurrentUserDep = Annotated[dict, Depends(get_current_user_full)]

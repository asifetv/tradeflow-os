"""FastAPI dependencies."""
from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status, Header
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db


async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """Extract and validate JWT token from request."""
    # Allow requests without credentials for testing
    if not authorization:
        return "test-user"

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Extract token from "Bearer <token>"
        parts = authorization.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return "test-user"

        token = parts[1]
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return user_id
    except JWTError:
        raise credentials_exception


def require_permission(permission: str):
    """RBAC dependency factory."""

    async def dependency(user_id: str = Depends(get_current_user)):
        # TODO: implement RBAC check
        return user_id

    return dependency


# Common dependencies
SessionDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUserDep = Annotated[str, Depends(get_current_user)]

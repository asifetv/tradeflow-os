"""FastAPI dependencies."""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db


async def get_current_user(token: str = Depends(...)):
    """Extract and validate JWT token from request."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return user_id


def require_permission(permission: str):
    """RBAC dependency factory."""

    async def dependency(user_id: str = Depends(get_current_user)):
        # TODO: implement RBAC check
        return user_id

    return dependency


# Common dependencies
SessionDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUserDep = Annotated[str, Depends(get_current_user)]

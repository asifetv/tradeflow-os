"""Authentication service for company registration and user login."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID
import hashlib
import secrets
import base64

from app.models.user import User
from app.models.company import Company
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.config import settings


class AuthService:
    """Service for authentication operations."""

    def __init__(self, db: AsyncSession):
        """Initialize auth service with database session."""
        self.db = db

    def _hash_password(self, password: str) -> str:
        """Hash a password using PBKDF2."""
        # Generate a salt
        salt = secrets.token_bytes(32)
        # Hash the password with salt using PBKDF2
        hash_obj = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt,
            100000,  # 100k iterations
        )
        # Combine salt and hash, encode as base64
        combined = salt + hash_obj
        return base64.b64encode(combined).decode('utf-8')

    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its PBKDF2 hash."""
        try:
            # Decode the stored hash
            combined = base64.b64decode(hashed_password.encode('utf-8'))
            salt = combined[:32]
            stored_hash = combined[32:]

            # Hash the provided password with the same salt
            hash_obj = hashlib.pbkdf2_hmac(
                'sha256',
                plain_password.encode('utf-8'),
                salt,
                100000,
            )

            # Compare hashes
            return hash_obj == stored_hash
        except Exception:
            return False

    def _create_access_token(self, user_id: UUID, company_id: UUID, email: str) -> str:
        """Create JWT access token with user and company info."""
        payload = {
            "sub": str(user_id),
            "company_id": str(company_id),
            "email": email,
            "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        }
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    async def register(self, data: RegisterRequest) -> TokenResponse:
        """Register new company and admin user."""
        # Check if email already exists (globally unique)
        existing_user = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        if existing_user.scalars().first():
            raise ValueError("Email already registered. Please use a different email or login if you already have an account.")

        # Check if subdomain already exists
        existing_company = await self.db.execute(
            select(Company).where(Company.subdomain == data.subdomain)
        )
        if existing_company.scalars().first():
            raise ValueError("Subdomain already taken. Please choose a different subdomain.")

        # Create company
        company = Company(
            company_name=data.company_name,
            subdomain=data.subdomain,
            is_active=True,
        )
        self.db.add(company)
        await self.db.flush()

        # Create admin user
        user = User(
            company_id=company.id,
            email=data.email,
            password_hash=self._hash_password(data.password),
            full_name=data.full_name,
            role="admin",
            is_active=True,
        )
        self.db.add(user)
        await self.db.flush()

        # Generate token
        access_token = self._create_access_token(user.id, company.id, user.email)

        return TokenResponse(
            access_token=access_token,
            user={
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
            },
            company={
                "id": str(company.id),
                "company_name": company.company_name,
                "subdomain": company.subdomain,
            },
        )

    async def login(self, data: LoginRequest, subdomain: str) -> TokenResponse:
        """Login user for specific company subdomain."""
        # Find company by subdomain
        company_result = await self.db.execute(
            select(Company).where(
                (Company.subdomain == subdomain)
                & (Company.is_active == True)
                & (Company.deleted_at.is_(None))
            )
        )
        company = company_result.scalars().first()
        if not company:
            raise ValueError("Invalid company or credentials")

        # Find user
        user_result = await self.db.execute(
            select(User).where(
                (User.email == data.email)
                & (User.company_id == company.id)
                & (User.is_active == True)
            )
        )
        user = user_result.scalars().first()
        if not user or not self._verify_password(data.password, user.password_hash):
            raise ValueError("Invalid company or credentials")

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        await self.db.flush()

        # Generate token
        access_token = self._create_access_token(user.id, company.id, user.email)

        return TokenResponse(
            access_token=access_token,
            user={
                "id": str(user.id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
            },
            company={
                "id": str(company.id),
                "company_name": company.company_name,
                "subdomain": company.subdomain,
            },
        )

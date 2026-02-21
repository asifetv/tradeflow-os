"""Tests for M0 Authentication and Multi-Tenancy."""
import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company
from app.models.user import User
from app.services.auth import AuthService
from app.schemas.auth import RegisterRequest, LoginRequest


class TestAuthService:
    """Test authentication service."""

    @pytest.mark.asyncio
    async def test_register_new_company(self, test_db):
        """Test registering a new company and admin user."""
        service = AuthService(test_db)

        register_data = RegisterRequest(
            company_name="Acme Trading",
            subdomain="acme",
            email="admin@acme.com",
            password="SecurePass123!",
            full_name="Admin User",
        )

        result = await service.register(register_data)

        assert result.access_token is not None
        assert result.token_type == "bearer"
        assert result.user["email"] == "admin@acme.com"
        assert result.user["full_name"] == "Admin User"
        assert result.user["role"] == "admin"
        assert result.company["company_name"] == "Acme Trading"
        assert result.company["subdomain"] == "acme"

    @pytest.mark.asyncio
    async def test_register_duplicate_subdomain(self, test_db, sample_company):
        """Test that duplicate subdomains are rejected."""
        service = AuthService(test_db)

        register_data = RegisterRequest(
            company_name="Another Company",
            subdomain=sample_company.subdomain,  # Duplicate
            email="another@example.com",
            password="SecurePass123!",
            full_name="Another Admin",
        )

        with pytest.raises(ValueError, match="Subdomain already taken"):
            await service.register(register_data)

    @pytest.mark.asyncio
    async def test_login_success(self, test_db, sample_company, sample_user):
        """Test successful login."""
        service = AuthService(test_db)

        login_data = LoginRequest(
            email=sample_user.email,
            password="TestPassword123",  # Password from conftest fixture
        )

        result = await service.login(login_data, sample_company.subdomain)

        assert result.access_token is not None
        assert result.token_type == "bearer"
        assert result.user["id"] == str(sample_user.id)
        assert result.user["email"] == sample_user.email
        assert result.company["id"] == str(sample_company.id)

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, test_db, sample_company, sample_user):
        """Test login with wrong password."""
        service = AuthService(test_db)

        login_data = LoginRequest(
            email=sample_user.email,
            password="WrongPassword123",
        )

        with pytest.raises(ValueError, match="Invalid company or credentials"):
            await service.login(login_data, sample_company.subdomain)

    @pytest.mark.asyncio
    async def test_login_wrong_subdomain(self, test_db, sample_user):
        """Test login with wrong subdomain."""
        service = AuthService(test_db)

        login_data = LoginRequest(
            email=sample_user.email,
            password="TestPassword123",
        )

        with pytest.raises(ValueError, match="Invalid company or credentials"):
            await service.login(login_data, "wrong-subdomain")

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, test_db, sample_company):
        """Test login with nonexistent user."""
        service = AuthService(test_db)

        login_data = LoginRequest(
            email="nonexistent@example.com",
            password="SomePassword123",
        )

        with pytest.raises(ValueError, match="Invalid company or credentials"):
            await service.login(login_data, sample_company.subdomain)

    @pytest.mark.asyncio
    async def test_password_hashing(self, test_db):
        """Test that passwords are properly hashed."""
        service = AuthService(test_db)

        plain_password = "MyPlainPassword123"
        hashed = service._hash_password(plain_password)

        # Hashed password should not be plain text
        assert hashed != plain_password

        # Should be able to verify
        assert service._verify_password(plain_password, hashed)

        # Wrong password should not verify
        assert not service._verify_password("WrongPassword", hashed)


class TestMultiTenancyIsolation:
    """Test multi-tenant data isolation."""

    @pytest.mark.asyncio
    async def test_company_a_cannot_see_company_b_deals(self, test_db, sample_company, sample_company_2, sample_deal, sample_deal_2):
        """Test that Company A cannot see Company B's deals."""
        from app.services.deal import DealService

        # Company A tries to access Company B's deal
        service = DealService(test_db, company_id=sample_company.id)

        # Should return None because deal belongs to different company
        result = await service.get_deal(sample_deal_2.id)

        assert result is None

    @pytest.mark.asyncio
    async def test_company_a_cannot_see_company_b_customers(self, test_db, sample_company, sample_company_2, sample_customer, sample_customer_2):
        """Test that Company A cannot see Company B's customers."""
        from app.services.customer import CustomerService

        # Company A tries to access Company B's customer
        service = CustomerService(test_db, company_id=sample_company.id)

        # Should return None because customer belongs to different company
        result = await service.get_customer(sample_customer_2.id)

        assert result is None

    @pytest.mark.asyncio
    async def test_list_deals_only_shows_company_deals(self, test_db, sample_company, sample_company_2):
        """Test that listing deals only returns current company's deals."""
        from app.services.deal import DealService

        # Company 1 has 2 deals, Company 2 has 1 deal
        # Company 1 service should only see 2 deals
        service = DealService(test_db, company_id=sample_company.id)

        result = await service.list_deals()

        assert result.total == 2
        assert all(deal.company_id == sample_company.id for deal in result.items)

    @pytest.mark.asyncio
    async def test_same_customer_code_different_companies(self, test_db, sample_company, sample_company_2):
        """Test that same customer code can exist in different companies."""
        from app.services.customer import CustomerService
        from app.schemas.customer import CustomerCreate

        # Create customer with code "CUST-001" in Company A
        service_a = CustomerService(test_db, company_id=sample_company.id)
        customer_a = await service_a.create_customer(
            CustomerCreate(
                customer_code="CUST-001",
                company_name="Client A",
                country="UAE",
            )
        )

        # Create customer with SAME code "CUST-001" in Company B
        service_b = CustomerService(test_db, company_id=sample_company_2.id)
        customer_b = await service_b.create_customer(
            CustomerCreate(
                customer_code="CUST-001",
                company_name="Client B",
                country="USA",
            )
        )

        # Both should exist and have different IDs
        assert customer_a.id != customer_b.id
        assert customer_a.customer_code == customer_b.customer_code

        # Company A should only see their customer
        result_a = await service_a.list_customers()
        assert len([c for c in result_a.items if c.customer_code == "CUST-001"]) == 1


class TestAuthEndpoints:
    """Test authentication API endpoints."""

    def test_register_endpoint(self, client):
        """Test POST /api/auth/register."""
        response = client.post(
            "/api/auth/register",
            json={
                "company_name": "Test Company",
                "subdomain": f"test-{uuid4().hex[:8]}",
                "email": f"admin-{uuid4().hex[:8]}@test.com",
                "password": "SecurePass123!",
                "full_name": "Test Admin",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert "company" in data

    def test_register_missing_subdomain(self, client):
        """Test that register fails without subdomain."""
        response = client.post(
            "/api/auth/register",
            json={
                "company_name": "Test Company",
                # Missing subdomain
                "email": "admin@test.com",
                "password": "SecurePass123!",
                "full_name": "Test Admin",
            },
        )

        assert response.status_code == 422  # Validation error

    def test_login_endpoint(self, client, sample_user, sample_company):
        """Test POST /api/auth/login."""
        response = client.post(
            "/api/auth/login",
            headers={"X-Subdomain": sample_company.subdomain},
            json={
                "email": sample_user.email,
                "password": "TestPassword123",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == sample_user.email

    def test_login_invalid_credentials(self, client, sample_company):
        """Test login with invalid credentials."""
        response = client.post(
            "/api/auth/login",
            headers={"X-Subdomain": sample_company.subdomain},
            json={
                "email": "nonexistent@test.com",
                "password": "WrongPassword123",
            },
        )

        assert response.status_code == 401

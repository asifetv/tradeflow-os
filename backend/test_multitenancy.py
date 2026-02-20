"""
Test multi-tenancy implementation.

Tests:
1. Database initialization
2. Company registration
3. User authentication
4. Multi-tenant isolation
"""
import asyncio
import sys
from datetime import datetime, timezone
from uuid import uuid4, UUID

from sqlalchemy import select, event
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.database import Base
from app.models.company import Company
from app.models.user import User
from app.models.deal import Deal, DealStatus
from app.models.vendor import Vendor
from app.models.vendor_proposal import VendorProposal
from app.services.auth import AuthService
from app.schemas.auth import RegisterRequest, LoginRequest
from app.services.deal import DealService
from app.schemas.deal import DealCreate, LineItemCreate
from app.config import settings


async def init_db():
    """Initialize database with all tables."""
    print("🔄 Initializing database...")

    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    await engine.dispose()
    print("✅ Database initialized\n")


async def test_registration_and_login():
    """Test 1: Register company and user, then login."""
    print("=" * 60)
    print("TEST 1: Company Registration & User Login")
    print("=" * 60)

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        auth_service = AuthService(db)

        # Register Company A
        print("\n📝 Registering Company A...")
        company_a_data = RegisterRequest(
            company_name="Acme Trading",
            subdomain="acme",
            email="admin@acme.com",
            password="password123",
            full_name="Admin User"
        )

        result_a = await auth_service.register(company_a_data)
        await db.commit()

        print(f"✅ Company A registered")
        print(f"   Company: {result_a.company['company_name']} ({result_a.company['subdomain']})")
        print(f"   User: {result_a.user['full_name']} ({result_a.user['email']})")
        print(f"   Token: {result_a.access_token[:50]}...")

        company_a_id = UUID(result_a.company['id'])
        user_a_id = UUID(result_a.user['id'])

        # Register Company B with different email (emails are globally unique)
        print("\n📝 Registering Company B (different email)...")
        company_b_data = RegisterRequest(
            company_name="Beta Corp",
            subdomain="beta",
            email="admin@beta.com",  # Different email (emails are globally unique)
            password="password456",
            full_name="Beta Admin"
        )

        result_b = await auth_service.register(company_b_data)
        await db.commit()

        print(f"✅ Company B registered with different email")
        print(f"   Company: {result_b.company['company_name']} ({result_b.company['subdomain']})")
        print(f"   Token: {result_b.access_token[:50]}...")

        company_b_id = UUID(result_b.company['id'])

        # Test login for Company A
        print("\n🔐 Testing login for Company A...")
        login_a = await auth_service.login(
            LoginRequest(email="admin@acme.com", password="password123"),
            subdomain="acme"
        )

        print(f"✅ Logged in to Company A")
        print(f"   User: {login_a.user['email']}")

        # Test login for Company B
        print("\n🔐 Testing login for Company B...")
        login_b = await auth_service.login(
            LoginRequest(email="admin@beta.com", password="password456"),
            subdomain="beta"
        )

        print(f"✅ Logged in to Company B")
        print(f"   User: {login_b.user['email']}")

        # Test wrong password fails
        print("\n❌ Testing wrong password...")
        try:
            await auth_service.login(
                LoginRequest(email="admin@acme.com", password="wrongpassword"),
                subdomain="acme"
            )
            print("❌ FAILED: Should have raised error for wrong password")
        except ValueError as e:
            print(f"✅ Correctly rejected: {str(e)}")

    await engine.dispose()
    return company_a_id, user_a_id, company_b_id


async def test_multitenancy_isolation(company_a_id, user_a_id, company_b_id):
    """Test 2: Verify multi-tenant isolation."""
    print("\n" + "=" * 60)
    print("TEST 2: Multi-Tenant Data Isolation")
    print("=" * 60)

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        # Create deal for Company A
        print("\n📝 Creating deal for Company A...")
        deal_service_a = DealService(db, user_id=user_a_id, company_id=company_a_id)

        deal_a = await deal_service_a.create_deal(
            DealCreate(
                deal_number=None,  # Auto-generate
                customer_id=None,
                customer_rfq_ref=None,
                description="Crude Oil Deal for Acme",
                currency="USD",
                line_items=[
                    LineItemCreate(
                        description="Brent Crude",
                        material_spec="ISO 3448",
                        quantity=1000,
                        unit="barrels",
                        required_delivery_date=None
                    )
                ],
                total_value=50000,
                total_cost=40000,
                estimated_margin_pct=20.0,
                notes="High priority"
            )
        )
        await db.commit()

        print(f"✅ Deal created for Company A: {deal_a.deal_number}")
        deal_a_id = deal_a.id

        # Try to access Company A's deal with Company B's service
        print("\n🔍 Company B trying to access Company A's deal...")
        deal_service_b = DealService(db, company_id=company_b_id)

        deal_from_b = await deal_service_b.get_deal(deal_a_id)

        if deal_from_b is None:
            print("✅ Company B correctly cannot see Company A's deal (isolation working!)")
        else:
            print("❌ FAILED: Company B should not be able to see Company A's deal!")
            sys.exit(1)

        # Verify Company A can see their own deal
        print("\n✓ Company A accessing their own deal...")
        deal_from_a = await deal_service_a.get_deal(deal_a_id)

        if deal_from_a:
            print(f"✅ Company A can access their deal: {deal_from_a.deal_number}")
        else:
            print("❌ FAILED: Company A should be able to see their own deal!")
            sys.exit(1)

        # List deals - Company A should see 1, Company B should see 0
        print("\n📊 Testing deal listings...")
        deals_a = await deal_service_a.list_deals()
        deals_b = await deal_service_b.list_deals()

        print(f"✅ Company A sees {deals_a.total} deal(s)")
        print(f"✅ Company B sees {deals_b.total} deal(s)")

        if deals_a.total == 1 and deals_b.total == 0:
            print("✅ Isolation working correctly!")
        else:
            print("❌ FAILED: Isolation is broken!")
            sys.exit(1)

    await engine.dispose()


async def test_company_scoped_ids(company_a_id, user_a_id):
    """Test 3: Verify company-scoped auto-increment IDs."""
    print("\n" + "=" * 60)
    print("TEST 3: Company-Scoped Auto-Increment IDs")
    print("=" * 60)

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        deal_service = DealService(db, user_id=user_a_id, company_id=company_a_id)

        # Create 3 deals
        deal_numbers = []
        for i in range(3):
            deal = await deal_service.create_deal(
                DealCreate(
                    deal_number=None,
                    customer_id=None,
                    customer_rfq_ref=None,
                    description=f"Test Deal {i+1}",
                    currency="USD",
                    line_items=[],
                    total_value=1000,
                    total_cost=800,
                    estimated_margin_pct=20.0,
                    notes=f"Deal number {i+1}"
                )
            )
            await db.commit()
            deal_numbers.append(deal.deal_number)
            print(f"✅ Created deal: {deal.deal_number}")

        # Verify sequential numbering
        expected = ["DEAL-001", "DEAL-002", "DEAL-003"]
        if deal_numbers == expected:
            print(f"\n✅ Deal numbers are sequential and company-scoped: {deal_numbers}")
        else:
            print(f"❌ FAILED: Expected {expected}, got {deal_numbers}")
            sys.exit(1)

    await engine.dispose()


async def run_all_tests():
    """Run all tests."""
    try:
        # Initialize database
        await init_db()

        # Test 1: Registration and Login
        company_a_id, user_a_id, company_b_id = await test_registration_and_login()

        # Test 2: Multi-tenant isolation
        await test_multitenancy_isolation(company_a_id, user_a_id, company_b_id)

        # Test 3: Company-scoped IDs
        await test_company_scoped_ids(company_a_id, user_a_id)

        print("\n" + "=" * 60)
        print("✅ ALL MULTI-TENANCY TESTS PASSED!")
        print("=" * 60)

        return True

    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    from uuid import UUID
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)

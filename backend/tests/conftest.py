"""Pytest configuration and shared fixtures."""
import pytest
import pytest_asyncio
from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import create_app
from app.database import Base, get_db
from app.models.deal import Deal, DealStatus
from app.models.activity_log import ActivityLog


# Test database URL - use StaticPool for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def test_db():
    """Create test database and tables."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
def app(test_db):
    """Create FastAPI test app."""
    app = create_app()

    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db
    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return TestClient(app)


@pytest_asyncio.fixture
async def sample_deal(test_db):
    """Create a sample deal for testing."""
    from uuid import uuid4
    deal = Deal(
        id=uuid4(),
        deal_number="TEST-DEAL-001",
        description="Test deal for unit tests",
        customer_rfq_ref="RFQ-TEST-001",
        status=DealStatus.RFQ_RECEIVED,
        currency="AED",
        total_value=100000.0,
        total_cost=60000.0,
        estimated_margin_pct=40.0,
        line_items=[
            {
                "description": "Steel Pipe",
                "material_spec": "API 5L X52",
                "quantity": 100,
                "unit": "MT",
                "required_delivery_date": "2024-03-15",
            }
        ],
    )
    test_db.add(deal)
    await test_db.flush()
    await test_db.refresh(deal)
    return deal


@pytest_asyncio.fixture
async def sample_deals(test_db):
    """Create multiple sample deals for testing."""
    from uuid import uuid4
    deals = []
    statuses = [
        DealStatus.RFQ_RECEIVED,
        DealStatus.SOURCING,
        DealStatus.QUOTED,
        DealStatus.CANCELLED,
    ]

    for i, status in enumerate(statuses):
        deal = Deal(
            id=uuid4(),
            deal_number=f"TEST-DEAL-{i:03d}",
            description=f"Test deal {i}",
            customer_rfq_ref=f"RFQ-TEST-{i:03d}",
            status=status,
            currency="AED",
            total_value=100000.0 * (i + 1),
        )
        test_db.add(deal)
        deals.append(deal)

    await test_db.flush()
    for deal in deals:
        await test_db.refresh(deal)
    return deals


@pytest.fixture
def user_id():
    """Get a test user ID."""
    return str(uuid4())

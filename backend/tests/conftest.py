"""Pytest configuration and shared fixtures."""
import pytest
import pytest_asyncio
from uuid import uuid4
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool, NullPool
from fastapi.testclient import TestClient

from app.main import create_app
from app.database import Base, get_db
from app.models.deal import Deal, DealStatus
from app.models.customer import Customer
from app.models.quote import Quote, QuoteStatus
from app.models.customer_po import CustomerPO, CustomerPOStatus
from app.models.activity_log import ActivityLog
from app.models.company import Company
from app.models.user import User
from app.models.vendor import Vendor
from app.models.vendor_proposal import VendorProposal, VendorProposalStatus


@pytest_asyncio.fixture
async def test_db():
    """Create test database and tables."""
    # Use a unique file for each test to avoid conflicts with StaticPool
    import tempfile
    import os

    # Create a temporary file for the test database
    fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(fd)

    try:
        TEST_DATABASE_URL = f"sqlite+aiosqlite:///{db_path}"

        engine = create_async_engine(
            TEST_DATABASE_URL,
            echo=False,
            connect_args={"check_same_thread": False},
            poolclass=NullPool,
        )

        async with engine.begin() as conn:
            # Create fresh tables
            await conn.run_sync(Base.metadata.create_all)

        async_session = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

        async with async_session() as session:
            yield session

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

        await engine.dispose()
    finally:
        # Clean up temporary database file
        if os.path.exists(db_path):
            os.unlink(db_path)


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
async def sample_company(test_db):
    """Create a sample company for testing."""
    company = Company(
        id=uuid4(),
        company_name="Test Company",
        subdomain="test",
        country="US",
        is_active=True
    )
    test_db.add(company)
    await test_db.flush()
    return company


@pytest_asyncio.fixture
async def sample_user(test_db, sample_company):
    """Create a sample user for testing."""
    from app.services.auth import AuthService
    auth_service = AuthService(test_db)

    # Use proper password hashing
    user = User(
        id=uuid4(),
        company_id=sample_company.id,
        email="test@example.com",
        password_hash=auth_service._hash_password("TestPassword123"),
        full_name="Test User",
        role="user",
        is_active=True
    )
    test_db.add(user)
    await test_db.flush()
    return user


@pytest_asyncio.fixture
async def sample_deal(test_db, sample_company):
    """Create a sample deal for testing."""
    from uuid import uuid4
    deal = Deal(
        id=uuid4(),
        company_id=sample_company.id,
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
async def sample_company_2(test_db):
    """Create a second sample company for multi-tenancy testing."""
    company = Company(
        id=uuid4(),
        company_name="Another Company",
        subdomain="another",
        country="UK",
        is_active=True
    )
    test_db.add(company)
    await test_db.flush()
    return company


@pytest_asyncio.fixture
async def sample_deals(test_db, sample_company):
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
            company_id=sample_company.id,
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


@pytest.fixture(autouse=True)
def mock_storage_service(monkeypatch):
    """Mock StorageService to prevent MinIO connection in tests."""
    from unittest.mock import Mock, patch

    # Mock StorageService for all tests
    def mock_storage_init(self):
        self.bucket_name = "documents"
        self.client = Mock()
        self.client.put_object = Mock(return_value=None)
        self.client.get_object = Mock(return_value=Mock(read=lambda: b"file content", close=lambda: None))
        self.client.get_presigned_download_url = Mock(return_value="http://presigned-url")
        self.client.remove_object = Mock(return_value=None)
        self.client.bucket_exists = Mock(return_value=True)

    monkeypatch.setattr("app.services.storage.StorageService.__init__", mock_storage_init)


@pytest_asyncio.fixture
async def sample_deal_2(test_db, sample_company_2):
    """Create a deal for the second company."""
    deal = Deal(
        id=uuid4(),
        company_id=sample_company_2.id,
        deal_number="TEST-DEAL-002",
        description="Test deal for second company",
        customer_rfq_ref="RFQ-TEST-002",
        status=DealStatus.RFQ_RECEIVED,
        currency="GBP",
        total_value=150000.0,
        total_cost=90000.0,
        estimated_margin_pct=40.0,
        line_items=[
            {
                "description": "Steel Pipe",
                "material_spec": "BS 3604",
                "quantity": 50,
                "unit": "MT",
                "required_delivery_date": "2024-04-15",
            }
        ],
    )
    test_db.add(deal)
    await test_db.flush()
    await test_db.refresh(deal)
    return deal


@pytest_asyncio.fixture
async def sample_customer(test_db, sample_company):
    """Create a sample customer for testing."""
    customer = Customer(
        id=uuid4(),
        company_id=sample_company.id,
        customer_code="TEST-CUST-001",
        company_name="Test Company Inc.",
        country="Saudi Arabia",
        city="Riyadh",
        primary_contact_name="John Smith",
        primary_contact_email="john@testcompany.com",
        primary_contact_phone="+966-1-234-5678",
        payment_terms="Net 60",
        credit_limit=500000.0,
        is_active=True,
    )
    test_db.add(customer)
    await test_db.flush()
    await test_db.refresh(customer)
    return customer


@pytest_asyncio.fixture
async def sample_customer_2(test_db, sample_company_2):
    """Create a customer for the second company."""
    customer = Customer(
        id=uuid4(),
        company_id=sample_company_2.id,
        customer_code="TEST-CUST-002",
        company_name="UK Trading Ltd.",
        country="United Kingdom",
        city="London",
        primary_contact_name="James Smith",
        primary_contact_email="james@uktrading.uk",
        primary_contact_phone="+44-20-1234-5678",
        payment_terms="Net 45",
        credit_limit=600000.0,
        is_active=True,
    )
    test_db.add(customer)
    await test_db.flush()
    await test_db.refresh(customer)
    return customer


@pytest_asyncio.fixture
async def sample_quote(test_db, sample_company, sample_customer, sample_deal):
    """Create a sample quote for testing."""
    quote = Quote(
        id=uuid4(),
        company_id=sample_company.id,
        quote_number="QT-TEST-001",
        customer_id=sample_customer.id,
        deal_id=sample_deal.id,
        title="Test Quote",
        status=QuoteStatus.DRAFT,
        total_amount=100000.0,
        currency="AED",
        validity_days=30,
        line_items=[
            {
                "description": "Steel Pipe",
                "material_spec": "API 5L",
                "quantity": 100,
                "unit": "MT",
                "unit_price": 1000.0,
                "total_price": 100000.0,
            }
        ],
    )
    test_db.add(quote)
    await test_db.flush()
    await test_db.refresh(quote)
    return quote


@pytest_asyncio.fixture
async def sample_customer_po(test_db, sample_company, sample_customer, sample_deal, sample_quote):
    """Create a sample customer PO for testing."""
    from datetime import date
    customer_po = CustomerPO(
        id=uuid4(),
        company_id=sample_company.id,
        internal_ref="CPO-TEST-001",
        po_number="PO-2024-001",
        customer_id=sample_customer.id,
        deal_id=sample_deal.id,
        quote_id=sample_quote.id,
        status=CustomerPOStatus.RECEIVED,
        total_amount=100000.0,
        currency="AED",
        po_date=date.today(),
        line_items=[
            {
                "description": "Steel Pipe",
                "material_spec": "API 5L",
                "quantity": 100,
                "unit": "MT",
                "unit_price": 1000.0,
                "total_price": 100000.0,
            }
        ],
    )
    test_db.add(customer_po)
    await test_db.flush()
    await test_db.refresh(customer_po)
    return customer_po


@pytest_asyncio.fixture
async def sample_vendor(test_db, sample_company):
    """Create a sample vendor for M3 Procurement testing."""
    vendor = Vendor(
        id=uuid4(),
        company_id=sample_company.id,
        vendor_code="VND-001",
        company_name="Reliable Steel Suppliers",
        country="UAE",
        certifications=["ISO 9001", "API 5L"],
        product_categories=["Pipes", "Valves"],
        credibility_score=85,
        on_time_delivery_rate=0.95,
        quality_score=90,
        avg_lead_time_days=14,
        primary_contact_name="Ahmed Al-Mansouri",
        primary_contact_email="ahmed@steelsupply.ae",
        primary_contact_phone="+971-4-123-4567",
        payment_terms="Net 30",
        is_active=True,
    )
    test_db.add(vendor)
    await test_db.flush()
    await test_db.refresh(vendor)
    return vendor


@pytest_asyncio.fixture
async def sample_vendors(test_db, sample_company):
    """Create multiple sample vendors for comparison testing."""
    vendors = []
    vendor_data = [
        {
            "vendor_code": "VND-001",
            "company_name": "Reliable Steel Suppliers",
            "credibility_score": 85,
            "lead_time_days": 14,
        },
        {
            "vendor_code": "VND-002",
            "company_name": "QuickDeal Pipes Ltd",
            "credibility_score": 65,
            "lead_time_days": 7,
        },
        {
            "vendor_code": "VND-003",
            "company_name": "Premium Materials Inc",
            "credibility_score": 95,
            "lead_time_days": 21,
        },
    ]

    for data in vendor_data:
        vendor = Vendor(
            id=uuid4(),
            company_id=sample_company.id,
            vendor_code=data["vendor_code"],
            company_name=data["company_name"],
            country="UAE",
            credibility_score=data["credibility_score"],
            is_active=True,
        )
        test_db.add(vendor)
        vendors.append(vendor)

    await test_db.flush()
    for vendor in vendors:
        await test_db.refresh(vendor)
    return vendors


@pytest_asyncio.fixture
async def sample_vendor_proposal(test_db, sample_company, sample_deal, sample_vendor):
    """Create a sample vendor proposal for testing."""
    proposal = VendorProposal(
        id=uuid4(),
        company_id=sample_company.id,
        deal_id=sample_deal.id,
        vendor_id=sample_vendor.id,
        status=VendorProposalStatus.RECEIVED,
        total_price=95000.0,
        currency="AED",
        lead_time_days=14,
        payment_terms="Net 30",
        specs_match=True,
        notes="Excellent pricing and delivery",
    )
    test_db.add(proposal)
    await test_db.flush()
    await test_db.refresh(proposal)
    return proposal


@pytest_asyncio.fixture
async def sample_vendor_proposals(test_db, sample_company, sample_deal, sample_vendors):
    """Create multiple vendor proposals for comparison testing."""
    proposals = []
    prices = [95000.0, 98000.0, 92000.0]
    statuses = [VendorProposalStatus.RECEIVED, VendorProposalStatus.RECEIVED, VendorProposalStatus.RECEIVED]

    for i, (vendor, price, status) in enumerate(zip(sample_vendors, prices, statuses)):
        proposal = VendorProposal(
            id=uuid4(),
            company_id=sample_company.id,
            deal_id=sample_deal.id,
            vendor_id=vendor.id,
            status=status,
            total_price=price,
            currency="AED",
            lead_time_days=14 if i == 0 else (7 if i == 1 else 21),
            payment_terms="Net 30",
            specs_match=True if i < 2 else False,
            discrepancies=None if i < 2 else {"material": "Not exactly API 5L X52"},
            notes=f"Proposal {i+1}",
        )
        test_db.add(proposal)
        proposals.append(proposal)

    await test_db.flush()
    for proposal in proposals:
        await test_db.refresh(proposal)
    return proposals

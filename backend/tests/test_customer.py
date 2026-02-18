"""Tests for Customer service and API."""
import pytest
from uuid import uuid4

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.services.customer import CustomerService


@pytest.mark.asyncio
async def test_create_customer(test_db, user_id):
    """Test creating a customer."""
    service = CustomerService(test_db, user_id=user_id)

    customer_data = CustomerCreate(
        customer_code="CUST-001",
        company_name="Acme Corporation",
        country="Saudi Arabia",
        city="Riyadh",
        primary_contact_name="John Doe",
        primary_contact_email="john@acme.com",
        primary_contact_phone="+966-1-234-5678",
        payment_terms="Net 30",
        credit_limit=1000000.0,
    )

    response = await service.create_customer(customer_data)

    assert response.customer_code == "CUST-001"
    assert response.company_name == "Acme Corporation"
    assert response.country == "Saudi Arabia"
    assert response.is_active is True


@pytest.mark.asyncio
async def test_get_customer(test_db, sample_customer, user_id):
    """Test getting a customer by ID."""
    service = CustomerService(test_db, user_id=user_id)

    customer = await service.get_customer(sample_customer.id)

    assert customer is not None
    assert customer.customer_code == "TEST-CUST-001"
    assert customer.company_name == "Test Company Inc."


@pytest.mark.asyncio
async def test_get_customer_not_found(test_db, user_id):
    """Test getting a non-existent customer."""
    service = CustomerService(test_db, user_id=user_id)

    customer = await service.get_customer(uuid4())

    assert customer is None


@pytest.mark.asyncio
async def test_list_customers(test_db, user_id):
    """Test listing customers."""
    service = CustomerService(test_db, user_id=user_id)

    # Create multiple customers
    for i in range(3):
        customer_data = CustomerCreate(
            customer_code=f"CUST-{i:03d}",
            company_name=f"Company {i}",
            country="Saudi Arabia",
        )
        await service.create_customer(customer_data)

    await test_db.commit()

    response = await service.list_customers(skip=0, limit=10)

    assert response.total == 3
    assert len(response.customers) == 3


@pytest.mark.asyncio
async def test_list_customers_with_filter(test_db, user_id):
    """Test listing customers with filters."""
    service = CustomerService(test_db, user_id=user_id)

    # Create customers
    for i in range(3):
        customer_data = CustomerCreate(
            customer_code=f"CUST-{i:03d}",
            company_name=f"Company {i}",
            country="Saudi Arabia" if i % 2 == 0 else "UAE",
            is_active=i % 2 == 0,
        )
        await service.create_customer(customer_data)

    await test_db.commit()

    # Filter by country
    response = await service.list_customers(country="Saudi Arabia")
    assert response.total == 2

    # Filter by active
    response = await service.list_customers(is_active=True)
    assert response.total == 2


@pytest.mark.asyncio
async def test_list_customers_with_search(test_db, user_id):
    """Test listing customers with search."""
    service = CustomerService(test_db, user_id=user_id)

    customer_data = CustomerCreate(
        customer_code="CUST-ACME",
        company_name="Acme Corporation",
        country="Saudi Arabia",
    )
    await service.create_customer(customer_data)
    await test_db.commit()

    # Search by company name
    response = await service.list_customers(search="Acme")
    assert response.total == 1

    # Search by customer code
    response = await service.list_customers(search="CUST-ACME")
    assert response.total == 1


@pytest.mark.asyncio
async def test_update_customer(test_db, sample_customer, user_id):
    """Test updating a customer."""
    service = CustomerService(test_db, user_id=user_id)

    update_data = CustomerUpdate(
        company_name="Updated Company Name",
        payment_terms="Net 90",
        credit_limit=2000000.0,
    )

    response = await service.update_customer(sample_customer.id, update_data)

    assert response is not None
    assert response.company_name == "Updated Company Name"
    assert response.payment_terms == "Net 90"
    assert response.credit_limit == 2000000.0


@pytest.mark.asyncio
async def test_update_customer_not_found(test_db, user_id):
    """Test updating a non-existent customer."""
    service = CustomerService(test_db, user_id=user_id)

    update_data = CustomerUpdate(company_name="Updated Name")

    response = await service.update_customer(uuid4(), update_data)

    assert response is None


@pytest.mark.asyncio
async def test_delete_customer(test_db, sample_customer, user_id):
    """Test deleting a customer (soft delete)."""
    service = CustomerService(test_db, user_id=user_id)

    deleted = await service.delete_customer(sample_customer.id)

    assert deleted is True

    # Verify soft delete
    customer = await service.get_customer(sample_customer.id)
    assert customer is None


@pytest.mark.asyncio
async def test_delete_customer_not_found(test_db, user_id):
    """Test deleting a non-existent customer."""
    service = CustomerService(test_db, user_id=user_id)

    deleted = await service.delete_customer(uuid4())

    assert deleted is False


@pytest.mark.asyncio
async def test_customer_api_create(client, user_id):
    """Test customer API create endpoint."""
    response = client.post(
        "/api/customers",
        json={
            "customer_code": "API-TEST-001",
            "company_name": "API Test Company",
            "country": "Saudi Arabia",
        },
        headers={"X-User-ID": user_id},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["customer_code"] == "API-TEST-001"
    assert data["company_name"] == "API Test Company"


@pytest.mark.asyncio
async def test_customer_api_list(client):
    """Test customer API list endpoint."""
    response = client.get("/api/customers")

    assert response.status_code == 200
    data = response.json()
    assert "customers" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_customer_api_get(client, sample_customer):
    """Test customer API get endpoint."""
    response = client.get(f"/api/customers/{sample_customer.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(sample_customer.id)
    assert data["customer_code"] == "TEST-CUST-001"

"""Tests for Quote service and API."""
import pytest
from uuid import uuid4

from app.models.quote import QuoteStatus
from app.schemas.quote import QuoteCreate, QuoteUpdate, QuoteStatusUpdate
from app.services.quote import QuoteService, VALID_QUOTE_STATUS_TRANSITIONS


@pytest.mark.asyncio
async def test_create_quote(test_db, sample_customer, sample_deal, user_id):
    """Test creating a quote."""
    service = QuoteService(test_db, user_id=user_id)

    quote_data = QuoteCreate(
        quote_number="QT-001",
        customer_id=sample_customer.id,
        deal_id=sample_deal.id,
        title="Test Quote",
        total_amount=100000.0,
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

    response = await service.create_quote(quote_data)

    assert response.quote_number == "QT-001"
    assert response.status == QuoteStatus.DRAFT
    assert response.total_amount == 100000.0
    assert len(response.line_items) == 1


@pytest.mark.asyncio
async def test_get_quote(test_db, sample_quote, user_id):
    """Test getting a quote by ID."""
    service = QuoteService(test_db, user_id=user_id)

    quote = await service.get_quote(sample_quote.id)

    assert quote is not None
    assert quote.quote_number == "QT-TEST-001"
    assert quote.status == QuoteStatus.DRAFT


@pytest.mark.asyncio
async def test_list_quotes_by_customer(test_db, sample_customer, user_id):
    """Test listing quotes by customer."""
    service = QuoteService(test_db, user_id=user_id)

    # Create multiple quotes for same customer
    for i in range(3):
        quote_data = QuoteCreate(
            quote_number=f"QT-{i:03d}",
            customer_id=sample_customer.id,
            title=f"Quote {i}",
            total_amount=10000.0 * (i + 1),
        )
        await service.create_quote(quote_data)

    await test_db.commit()

    response = await service.list_quotes(customer_id=sample_customer.id)

    assert response.total == 3
    assert len(response.quotes) == 3


@pytest.mark.asyncio
async def test_list_quotes_by_status(test_db, sample_customer, user_id):
    """Test listing quotes by status."""
    service = QuoteService(test_db, user_id=user_id)

    # Create a draft quote
    quote_data = QuoteCreate(
        quote_number="QT-DRAFT",
        customer_id=sample_customer.id,
        title="Draft Quote",
        total_amount=100000.0,
    )
    draft_quote = await service.create_quote(quote_data)

    # Create and transition to SENT
    quote_data_sent = QuoteCreate(
        quote_number="QT-SENT",
        customer_id=sample_customer.id,
        title="Sent Quote",
        total_amount=100000.0,
    )
    sent_quote = await service.create_quote(quote_data_sent)
    await service.update_quote_status(sent_quote.id, QuoteStatus.SENT)

    await test_db.commit()

    # List sent quotes
    response = await service.list_quotes(status=QuoteStatus.SENT)
    assert response.total == 1


@pytest.mark.asyncio
async def test_update_quote(test_db, sample_quote, user_id):
    """Test updating a quote."""
    service = QuoteService(test_db, user_id=user_id)

    update_data = QuoteUpdate(
        title="Updated Quote Title",
        total_amount=150000.0,
    )

    response = await service.update_quote(sample_quote.id, update_data)

    assert response is not None
    assert response.title == "Updated Quote Title"
    assert response.total_amount == 150000.0


@pytest.mark.asyncio
async def test_quote_status_transition_valid(test_db, sample_quote, user_id):
    """Test valid quote status transition."""
    service = QuoteService(test_db, user_id=user_id)

    # DRAFT -> SENT is valid
    response = await service.update_quote_status(sample_quote.id, QuoteStatus.SENT)

    assert response is not None
    assert response.status == QuoteStatus.SENT


@pytest.mark.asyncio
async def test_quote_status_transition_invalid(test_db, sample_quote, user_id):
    """Test invalid quote status transition."""
    service = QuoteService(test_db, user_id=user_id)

    # DRAFT -> ACCEPTED is invalid
    with pytest.raises(ValueError, match="Invalid status transition"):
        await service.update_quote_status(sample_quote.id, QuoteStatus.ACCEPTED)


@pytest.mark.asyncio
async def test_quote_state_machine_transitions(test_db, sample_quote, user_id):
    """Test all valid state machine transitions."""
    service = QuoteService(test_db, user_id=user_id)

    # Test DRAFT -> SENT transition
    quote = await service.update_quote_status(sample_quote.id, QuoteStatus.SENT)
    assert quote.status == QuoteStatus.SENT

    # Test SENT -> ACCEPTED transition
    quote = await service.update_quote_status(sample_quote.id, QuoteStatus.ACCEPTED)
    assert quote.status == QuoteStatus.ACCEPTED

    # Test ACCEPTED is terminal (no valid transitions)
    assert len(VALID_QUOTE_STATUS_TRANSITIONS[QuoteStatus.ACCEPTED]) == 0


@pytest.mark.asyncio
async def test_delete_quote(test_db, sample_quote, user_id):
    """Test deleting a quote (soft delete)."""
    service = QuoteService(test_db, user_id=user_id)

    deleted = await service.delete_quote(sample_quote.id)

    assert deleted is True

    # Verify soft delete
    quote = await service.get_quote(sample_quote.id)
    assert quote is None


@pytest.mark.asyncio
async def test_quote_api_create(client, sample_customer, sample_deal, user_id):
    """Test quote API create endpoint."""
    response = client.post(
        "/api/quotes",
        json={
            "quote_number": "API-QT-001",
            "customer_id": str(sample_customer.id),
            "deal_id": str(sample_deal.id),
            "title": "API Test Quote",
            "total_amount": 50000.0,
            "line_items": [
                {
                    "description": "Test Item",
                    "quantity": 10,
                    "unit": "MT",
                    "unit_price": 5000.0,
                    "total_price": 50000.0,
                }
            ],
        },
        headers={"X-User-ID": user_id},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["quote_number"] == "API-QT-001"
    assert data["status"] == "draft"


@pytest.mark.asyncio
async def test_quote_api_status_update(client, sample_quote, user_id):
    """Test quote API status update endpoint."""
    response = client.patch(
        f"/api/quotes/{sample_quote.id}/status",
        json={"status": "sent"},
        headers={"X-User-ID": user_id},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "sent"


@pytest.mark.asyncio
async def test_quote_api_invalid_status_transition(client, sample_quote, user_id):
    """Test quote API with invalid status transition."""
    response = client.patch(
        f"/api/quotes/{sample_quote.id}/status",
        json={"status": "accepted"},
        headers={"X-User-ID": user_id},
    )

    assert response.status_code == 400

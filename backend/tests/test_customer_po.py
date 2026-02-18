"""Tests for CustomerPO service and API."""
import pytest
from datetime import date
from uuid import uuid4

from app.models.customer_po import CustomerPOStatus
from app.models.deal import DealStatus
from app.schemas.customer_po import CustomerPOCreate, CustomerPOUpdate, CustomerPOStatusUpdate
from app.services.customer_po import CustomerPOService, VALID_CUSTOMER_PO_STATUS_TRANSITIONS


@pytest.mark.asyncio
async def test_create_customer_po(test_db, sample_customer, sample_deal, user_id):
    """Test creating a customer PO."""
    service = CustomerPOService(test_db, user_id=user_id)

    po_data = CustomerPOCreate(
        internal_ref="CPO-001",
        po_number="PO-2024-001",
        customer_id=sample_customer.id,
        deal_id=sample_deal.id,
        total_amount=100000.0,
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

    response = await service.create_customer_po(po_data)

    assert response.internal_ref == "CPO-001"
    assert response.po_number == "PO-2024-001"
    assert response.status == CustomerPOStatus.RECEIVED
    assert response.total_amount == 100000.0


@pytest.mark.asyncio
async def test_get_customer_po(test_db, sample_customer_po, user_id):
    """Test getting a customer PO by ID."""
    service = CustomerPOService(test_db, user_id=user_id)

    customer_po = await service.get_customer_po(sample_customer_po.id)

    assert customer_po is not None
    assert customer_po.internal_ref == "CPO-TEST-001"
    assert customer_po.status == CustomerPOStatus.RECEIVED


@pytest.mark.asyncio
async def test_list_customer_pos_by_customer(test_db, sample_customer, user_id):
    """Test listing customer POs by customer."""
    service = CustomerPOService(test_db, user_id=user_id)

    # Create multiple POs for same customer
    for i in range(3):
        po_data = CustomerPOCreate(
            internal_ref=f"CPO-{i:03d}",
            po_number=f"PO-{i:03d}",
            customer_id=sample_customer.id,
            total_amount=100000.0,
            po_date=date.today(),
        )
        await service.create_customer_po(po_data)

    await test_db.commit()

    response = await service.list_customer_pos(customer_id=sample_customer.id)

    assert response.total == 3
    assert len(response.customer_pos) == 3


@pytest.mark.asyncio
async def test_list_customer_pos_by_status(test_db, sample_customer, user_id):
    """Test listing customer POs by status."""
    service = CustomerPOService(test_db, user_id=user_id)

    # Create PO
    po_data = CustomerPOCreate(
        internal_ref="CPO-STATUS",
        po_number="PO-STATUS",
        customer_id=sample_customer.id,
        total_amount=100000.0,
        po_date=date.today(),
    )
    po = await service.create_customer_po(po_data)
    await test_db.commit()

    # List by status
    response = await service.list_customer_pos(status=CustomerPOStatus.RECEIVED)

    assert response.total >= 1


@pytest.mark.asyncio
async def test_update_customer_po(test_db, sample_customer_po, user_id):
    """Test updating a customer PO."""
    service = CustomerPOService(test_db, user_id=user_id)

    update_data = CustomerPOUpdate(
        po_number="PO-2024-UPDATED",
        total_amount=150000.0,
    )

    response = await service.update_customer_po(sample_customer_po.id, update_data)

    assert response is not None
    assert response.po_number == "PO-2024-UPDATED"
    assert response.total_amount == 150000.0


@pytest.mark.asyncio
async def test_customer_po_status_transition_valid(test_db, sample_customer_po, user_id):
    """Test valid customer PO status transition."""
    service = CustomerPOService(test_db, user_id=user_id)

    # RECEIVED -> ACKNOWLEDGED is valid
    response = await service.update_customer_po_status(
        sample_customer_po.id, CustomerPOStatus.ACKNOWLEDGED
    )

    assert response is not None
    assert response.status == CustomerPOStatus.ACKNOWLEDGED


@pytest.mark.asyncio
async def test_customer_po_status_transition_invalid(test_db, sample_customer_po, user_id):
    """Test invalid customer PO status transition."""
    service = CustomerPOService(test_db, user_id=user_id)

    # RECEIVED -> FULFILLED is invalid
    with pytest.raises(ValueError, match="Invalid status transition"):
        await service.update_customer_po_status(
            sample_customer_po.id, CustomerPOStatus.FULFILLED
        )


@pytest.mark.asyncio
async def test_customer_po_auto_update_deal_status(test_db, sample_customer_po, sample_deal, user_id):
    """Test that acknowledging a PO auto-updates deal status."""
    service = CustomerPOService(test_db, user_id=user_id)

    # First, set deal status to QUOTED (valid transition from RFQ_RECEIVED)
    from app.services.deal import DealService
    deal_service = DealService(test_db, user_id=user_id)
    await deal_service.update_deal_status(sample_deal.id, DealStatus.QUOTED)
    await test_db.commit()

    # Update PO status to ACKNOWLEDGED
    await service.update_customer_po_status(
        sample_customer_po.id, CustomerPOStatus.ACKNOWLEDGED
    )

    await test_db.refresh(sample_deal)

    # Verify deal status was auto-updated to PO_RECEIVED
    assert sample_deal.status == DealStatus.PO_RECEIVED


@pytest.mark.asyncio
async def test_customer_po_state_machine_transitions(test_db, sample_customer_po, user_id):
    """Test all valid state machine transitions."""
    service = CustomerPOService(test_db, user_id=user_id)

    # Test RECEIVED -> ACKNOWLEDGED transition
    po = await service.update_customer_po_status(
        sample_customer_po.id, CustomerPOStatus.ACKNOWLEDGED
    )
    assert po.status == CustomerPOStatus.ACKNOWLEDGED

    # Test ACKNOWLEDGED -> IN_PROGRESS transition
    po = await service.update_customer_po_status(
        sample_customer_po.id, CustomerPOStatus.IN_PROGRESS
    )
    assert po.status == CustomerPOStatus.IN_PROGRESS

    # Test IN_PROGRESS -> FULFILLED transition
    po = await service.update_customer_po_status(
        sample_customer_po.id, CustomerPOStatus.FULFILLED
    )
    assert po.status == CustomerPOStatus.FULFILLED

    # Test FULFILLED is terminal (no valid transitions)
    assert len(VALID_CUSTOMER_PO_STATUS_TRANSITIONS[CustomerPOStatus.FULFILLED]) == 0


@pytest.mark.asyncio
async def test_delete_customer_po(test_db, sample_customer_po, user_id):
    """Test deleting a customer PO (soft delete)."""
    service = CustomerPOService(test_db, user_id=user_id)

    deleted = await service.delete_customer_po(sample_customer_po.id)

    assert deleted is True

    # Verify soft delete
    customer_po = await service.get_customer_po(sample_customer_po.id)
    assert customer_po is None


@pytest.mark.asyncio
async def test_customer_po_api_create(client, sample_customer, sample_deal, user_id):
    """Test customer PO API create endpoint."""
    response = client.post(
        "/api/customer-pos",
        json={
            "internal_ref": "CPO-API-001",
            "po_number": "PO-API-001",
            "customer_id": str(sample_customer.id),
            "deal_id": str(sample_deal.id),
            "total_amount": 100000.0,
            "po_date": "2024-02-18",
        },
        headers={"X-User-ID": user_id},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["internal_ref"] == "CPO-API-001"
    assert data["status"] == "received"


@pytest.mark.asyncio
async def test_customer_po_api_status_update(client, sample_customer_po, user_id):
    """Test customer PO API status update endpoint."""
    response = client.patch(
        f"/api/customer-pos/{sample_customer_po.id}/status",
        json={"status": "acknowledged"},
        headers={"X-User-ID": user_id},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "acknowledged"


@pytest.mark.asyncio
async def test_customer_po_api_invalid_status_transition(client, sample_customer_po, user_id):
    """Test customer PO API with invalid status transition."""
    response = client.patch(
        f"/api/customer-pos/{sample_customer_po.id}/status",
        json={"status": "fulfilled"},
        headers={"X-User-ID": user_id},
    )

    assert response.status_code == 400

"""Tests for service layer."""
import pytest
from uuid import uuid4

from app.models.deal import Deal, DealStatus
from app.schemas.deal import DealCreate, DealUpdate, DealListResponse
from app.services.deal import DealService, VALID_STATUS_TRANSITIONS
from app.services.activity_log import ActivityLogService


@pytest.mark.asyncio
async def test_create_deal(test_db, user_id):
    """Test creating a deal."""
    service = DealService(test_db, user_id=user_id)

    deal_data = DealCreate(
        deal_number="DEAL-001",
        description="Test deal",
        customer_rfq_ref="RFQ-001",
        total_value=50000,
        line_items=[
            {
                "description": "Pipe",
                "material_spec": "API 5L",
                "quantity": 100,
                "unit": "MT",
                "required_delivery_date": "2024-03-15",
            }
        ],
    )

    response = await service.create_deal(deal_data)

    assert response.deal_number == "DEAL-001"
    assert response.status == DealStatus.RFQ_RECEIVED
    assert response.description == "Test deal"
    assert len(response.line_items) == 1


@pytest.mark.asyncio
async def test_get_deal(test_db, sample_deal, user_id):
    """Test getting a deal by ID."""
    service = DealService(test_db, user_id=user_id)

    deal = await service.get_deal(sample_deal.id)

    assert deal is not None
    assert deal.deal_number == "TEST-DEAL-001"
    assert deal.status == DealStatus.RFQ_RECEIVED


@pytest.mark.asyncio
async def test_get_nonexistent_deal(test_db, user_id):
    """Test getting a deal that doesn't exist."""
    service = DealService(test_db, user_id=user_id)

    deal = await service.get_deal(uuid4())

    assert deal is None


@pytest.mark.asyncio
async def test_list_deals(test_db, sample_deals, user_id):
    """Test listing deals."""
    service = DealService(test_db, user_id=user_id)

    response = await service.list_deals(skip=0, limit=50)

    assert response.total == 4
    assert len(response.deals) == 4
    assert response.skip == 0
    assert response.limit == 50


@pytest.mark.asyncio
async def test_list_deals_with_status_filter(test_db, sample_deals, user_id):
    """Test listing deals with status filter."""
    service = DealService(test_db, user_id=user_id)

    response = await service.list_deals(
        skip=0, limit=50, status=DealStatus.SOURCING
    )

    assert response.total == 1
    assert len(response.deals) == 1
    assert response.deals[0].status == DealStatus.SOURCING


@pytest.mark.asyncio
async def test_list_deals_pagination(test_db, sample_deals, user_id):
    """Test pagination in deal listing."""
    service = DealService(test_db, user_id=user_id)

    response = await service.list_deals(skip=0, limit=2)

    assert response.total == 4
    assert len(response.deals) == 2
    assert response.skip == 0
    assert response.limit == 2


@pytest.mark.asyncio
async def test_update_deal(test_db, sample_deal, user_id):
    """Test updating a deal."""
    service = DealService(test_db, user_id=user_id)

    update_data = DealUpdate(
        description="Updated description",
        total_value=150000,
    )

    response = await service.update_deal(sample_deal.id, update_data)

    assert response is not None
    assert response.description == "Updated description"
    assert response.total_value == 150000
    assert response.deal_number == "TEST-DEAL-001"  # Unchanged


@pytest.mark.asyncio
async def test_update_nonexistent_deal(test_db, user_id):
    """Test updating a deal that doesn't exist."""
    service = DealService(test_db, user_id=user_id)

    update_data = DealUpdate(description="Updated")
    response = await service.update_deal(uuid4(), update_data)

    assert response is None


@pytest.mark.asyncio
async def test_valid_status_transition(test_db, sample_deal, user_id):
    """Test valid status transition."""
    service = DealService(test_db, user_id=user_id)

    response = await service.update_deal_status(
        sample_deal.id, DealStatus.SOURCING
    )

    assert response is not None
    assert response.status == DealStatus.SOURCING


@pytest.mark.asyncio
async def test_invalid_status_transition(test_db, sample_deal, user_id):
    """Test invalid status transition raises error."""
    service = DealService(test_db, user_id=user_id)

    # Change to CLOSED (end state)
    sample_deal.status = DealStatus.CLOSED
    await test_db.flush()

    with pytest.raises(ValueError) as exc_info:
        await service.update_deal_status(sample_deal.id, DealStatus.RFQ_RECEIVED)

    assert "Invalid status transition" in str(exc_info.value)


@pytest.mark.asyncio
async def test_delete_deal_soft_delete(test_db, sample_deal, user_id):
    """Test soft delete of a deal."""
    service = DealService(test_db, user_id=user_id)

    deleted = await service.delete_deal(sample_deal.id)

    assert deleted is True

    # Verify deal is not returned in queries
    deal = await service.get_deal(sample_deal.id)
    assert deal is None


@pytest.mark.asyncio
async def test_delete_nonexistent_deal(test_db, user_id):
    """Test deleting a deal that doesn't exist."""
    service = DealService(test_db, user_id=user_id)

    deleted = await service.delete_deal(uuid4())

    assert deleted is False


@pytest.mark.asyncio
async def test_state_machine_transitions():
    """Test state machine transition rules."""
    # RFQ_RECEIVED should allow SOURCING, QUOTED, CANCELLED
    assert DealStatus.SOURCING in VALID_STATUS_TRANSITIONS[DealStatus.RFQ_RECEIVED]
    assert DealStatus.QUOTED in VALID_STATUS_TRANSITIONS[DealStatus.RFQ_RECEIVED]
    assert DealStatus.CANCELLED in VALID_STATUS_TRANSITIONS[DealStatus.RFQ_RECEIVED]

    # CLOSED should have no valid transitions
    assert len(VALID_STATUS_TRANSITIONS[DealStatus.CLOSED]) == 0

    # CANCELLED should have no valid transitions
    assert len(VALID_STATUS_TRANSITIONS[DealStatus.CANCELLED]) == 0


@pytest.mark.asyncio
async def test_activity_log_on_create(test_db, user_id):
    """Test that activity log is created on deal creation."""
    service = DealService(test_db, user_id=user_id)

    deal_data = DealCreate(
        deal_number="DEAL-LOG-001",
        description="Test activity logging",
    )

    deal = await service.create_deal(deal_data)

    # Get activity logs
    activity_service = ActivityLogService(test_db)
    logs, total = await activity_service.get_deal_activity_logs(deal.id)

    assert total >= 1
    assert any(log.action == "created" for log in logs)


@pytest.mark.asyncio
async def test_activity_log_on_update(test_db, sample_deal, user_id):
    """Test that activity log is created on deal update."""
    service = DealService(test_db, user_id=user_id)

    update_data = DealUpdate(description="Updated description")
    await service.update_deal(sample_deal.id, update_data)

    # Get activity logs
    activity_service = ActivityLogService(test_db)
    logs, total = await activity_service.get_deal_activity_logs(sample_deal.id)

    assert total >= 1
    assert any(log.action == "updated" for log in logs)


@pytest.mark.asyncio
async def test_activity_log_on_status_change(test_db, sample_deal, user_id):
    """Test that activity log is created on status change."""
    service = DealService(test_db, user_id=user_id)

    await service.update_deal_status(sample_deal.id, DealStatus.SOURCING)

    # Get activity logs
    activity_service = ActivityLogService(test_db)
    logs, total = await activity_service.get_deal_activity_logs(sample_deal.id)

    assert total >= 1
    status_change = next(
        (log for log in logs if log.action == "status_changed"), None
    )
    assert status_change is not None
    assert any(c.field == "status" for c in status_change.changes)


@pytest.mark.asyncio
async def test_activity_log_on_delete(test_db, sample_deal, user_id):
    """Test that activity log is created on delete."""
    service = DealService(test_db, user_id=user_id)

    await service.delete_deal(sample_deal.id)

    # Get activity logs (before soft delete filter)
    activity_service = ActivityLogService(test_db)
    logs, total = await activity_service.get_deal_activity_logs(sample_deal.id)

    assert total >= 1
    assert any(log.action == "deleted" for log in logs)


@pytest.mark.asyncio
async def test_compute_changes():
    """Test the compute_changes method."""
    old_data = {
        "description": "Old description",
        "total_value": 100000,
        "status": "rfq_received",
    }

    new_data = {
        "description": "New description",
        "total_value": 150000,
        "status": "rfq_received",
    }

    changes = ActivityLogService.compute_changes(old_data, new_data)

    assert len(changes) == 2
    assert any(c.field == "description" for c in changes)
    assert any(c.field == "total_value" for c in changes)
    assert not any(c.field == "status" for c in changes)  # Unchanged

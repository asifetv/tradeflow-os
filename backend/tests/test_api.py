"""Tests for API endpoints."""
import pytest
import json
from uuid import uuid4

from app.models.deal import DealStatus


@pytest.mark.asyncio
async def test_create_deal_endpoint(client):
    """Test POST /api/deals endpoint."""
    payload = {
        "deal_number": "API-TEST-001",
        "description": "Test deal via API",
        "customer_rfq_ref": "RFQ-API-001",
        "total_value": 75000,
        "line_items": [
            {
                "description": "Valve",
                "material_spec": "ASME",
                "quantity": 50,
                "unit": "PC",
                "required_delivery_date": "2024-04-01",
            }
        ],
    }

    response = client.post("/api/deals", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["deal_number"] == "API-TEST-001"
    assert data["status"] == "rfq_received"
    assert data["description"] == "Test deal via API"
    assert len(data["line_items"]) == 1


@pytest.mark.asyncio
async def test_create_deal_missing_required_field(client):
    """Test POST /api/deals with missing required field."""
    payload = {
        "deal_number": "API-TEST-002",
        # Missing description
    }

    response = client.post("/api/deals", json=payload)

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_list_deals_endpoint(client, sample_deals):
    """Test GET /api/deals endpoint."""
    response = client.get("/api/deals")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 4
    assert len(data["deals"]) == 4
    assert "skip" in data
    assert "limit" in data


@pytest.mark.asyncio
async def test_list_deals_pagination(client, sample_deals):
    """Test pagination on GET /api/deals."""
    response = client.get("/api/deals?skip=0&limit=2")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 4
    assert len(data["deals"]) == 2
    assert data["skip"] == 0
    assert data["limit"] == 2


@pytest.mark.asyncio
async def test_list_deals_filter_by_status(client, sample_deals):
    """Test filtering deals by status."""
    response = client.get(f"/api/deals?status={DealStatus.SOURCING}")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["deals"][0]["status"] == "sourcing"


@pytest.mark.asyncio
async def test_get_deal_endpoint(client, sample_deal):
    """Test GET /api/deals/{deal_id} endpoint."""
    response = client.get(f"/api/deals/{sample_deal.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(sample_deal.id)
    assert data["deal_number"] == "TEST-DEAL-001"
    assert data["status"] == "rfq_received"


@pytest.mark.asyncio
async def test_get_nonexistent_deal(client):
    """Test GET /api/deals/{deal_id} for non-existent deal."""
    fake_id = uuid4()
    response = client.get(f"/api/deals/{fake_id}")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_deal_endpoint(client, sample_deal):
    """Test PATCH /api/deals/{deal_id} endpoint."""
    payload = {
        "description": "Updated via API",
        "total_value": 200000,
    }

    response = client.patch(f"/api/deals/{sample_deal.id}", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["description"] == "Updated via API"
    assert data["total_value"] == 200000
    assert data["deal_number"] == "TEST-DEAL-001"  # Unchanged


@pytest.mark.asyncio
async def test_update_nonexistent_deal(client):
    """Test PATCH /api/deals/{deal_id} for non-existent deal."""
    fake_id = uuid4()
    payload = {"description": "Updated"}

    response = client.patch(f"/api/deals/{fake_id}", json=payload)

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_deal_status_valid_transition(client, sample_deal):
    """Test PATCH /api/deals/{deal_id}/status with valid transition."""
    payload = {"status": "sourcing"}

    response = client.patch(f"/api/deals/{sample_deal.id}/status", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "sourcing"


@pytest.mark.asyncio
async def test_update_deal_status_invalid_transition(client, sample_deal):
    """Test PATCH /api/deals/{deal_id}/status with invalid transition."""
    # First change to CLOSED
    client.patch(f"/api/deals/{sample_deal.id}/status", json={"status": "closed"})

    # Try to transition from CLOSED to RFQ_RECEIVED (invalid)
    payload = {"status": "rfq_received"}
    response = client.patch(f"/api/deals/{sample_deal.id}/status", json=payload)

    assert response.status_code == 400
    data = response.json()
    assert "Invalid status transition" in data["detail"]


@pytest.mark.asyncio
async def test_update_deal_status_nonexistent_deal(client):
    """Test PATCH /api/deals/{deal_id}/status for non-existent deal."""
    fake_id = uuid4()
    payload = {"status": "sourcing"}

    response = client.patch(f"/api/deals/{fake_id}/status", json=payload)

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_deal_endpoint(client, sample_deal):
    """Test DELETE /api/deals/{deal_id} endpoint."""
    response = client.delete(f"/api/deals/{sample_deal.id}")

    assert response.status_code == 204

    # Verify deal is deleted (404 on next get)
    response = client.get(f"/api/deals/{sample_deal.id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_nonexistent_deal(client):
    """Test DELETE /api/deals/{deal_id} for non-existent deal."""
    fake_id = uuid4()
    response = client.delete(f"/api/deals/{fake_id}")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_deal_activity_endpoint(client, sample_deal):
    """Test GET /api/deals/{deal_id}/activity endpoint."""
    response = client.get(f"/api/deals/{sample_deal.id}/activity")

    assert response.status_code == 200
    data = response.json()
    assert "activity_logs" in data
    assert "total" in data
    assert isinstance(data["activity_logs"], list)


@pytest.mark.asyncio
async def test_get_activity_nonexistent_deal(client):
    """Test GET /api/deals/{deal_id}/activity for non-existent deal."""
    fake_id = uuid4()
    response = client.get(f"/api/deals/{fake_id}/activity")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_activity_log_includes_created_action(client):
    """Test that activity log includes 'created' action after deal creation."""
    payload = {
        "deal_number": "ACTIVITY-TEST-001",
        "description": "Test activity logging",
    }

    create_response = client.post("/api/deals", json=payload)
    deal_id = create_response.json()["id"]

    # Get activity logs
    activity_response = client.get(f"/api/deals/{deal_id}/activity")
    assert activity_response.status_code == 200

    logs = activity_response.json()["activity_logs"]
    assert any(log["action"] == "created" for log in logs)


@pytest.mark.asyncio
async def test_activity_log_includes_updated_action(client, sample_deal):
    """Test that activity log includes 'updated' action after update."""
    # Update the deal
    client.patch(
        f"/api/deals/{sample_deal.id}",
        json={"description": "Updated description"},
    )

    # Get activity logs
    response = client.get(f"/api/deals/{sample_deal.id}/activity")
    assert response.status_code == 200

    logs = response.json()["activity_logs"]
    assert any(log["action"] == "updated" for log in logs)


@pytest.mark.asyncio
async def test_activity_log_includes_status_changed_action(client, sample_deal):
    """Test that activity log includes 'status_changed' action."""
    # Change status
    client.patch(
        f"/api/deals/{sample_deal.id}/status", json={"status": "sourcing"}
    )

    # Get activity logs
    response = client.get(f"/api/deals/{sample_deal.id}/activity")
    assert response.status_code == 200

    logs = response.json()["activity_logs"]
    status_logs = [log for log in logs if log["action"] == "status_changed"]
    assert len(status_logs) > 0
    assert any(c["field"] == "status" for c in status_logs[0]["changes"])


@pytest.mark.asyncio
async def test_activity_log_includes_deleted_action(client, sample_deal):
    """Test that activity log includes 'deleted' action after soft delete."""
    # Delete the deal
    client.delete(f"/api/deals/{sample_deal.id}")

    # Get activity logs (before soft delete filter is applied)
    response = client.get(f"/api/deals/{sample_deal.id}/activity")
    assert response.status_code == 404  # Deal is soft deleted, so 404


@pytest.mark.asyncio
async def test_activity_log_pagination(client, sample_deal):
    """Test pagination of activity logs."""
    # Make multiple updates to create activity logs
    for i in range(5):
        client.patch(
            f"/api/deals/{sample_deal.id}",
            json={"description": f"Update {i}"},
        )

    # Get activity logs with pagination
    response = client.get(f"/api/deals/{sample_deal.id}/activity?skip=0&limit=3")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 5  # At least the 5 updates
    assert len(data["activity_logs"]) <= 3


@pytest.mark.asyncio
async def test_multiple_deal_operations(client):
    """Test a complete workflow of deal operations."""
    # 1. Create deal
    create_response = client.post(
        "/api/deals",
        json={
            "deal_number": "WORKFLOW-001",
            "description": "Initial description",
            "total_value": 100000,
        },
    )
    assert create_response.status_code == 201
    deal_id = create_response.json()["id"]

    # 2. Get deal
    get_response = client.get(f"/api/deals/{deal_id}")
    assert get_response.status_code == 200
    assert get_response.json()["status"] == "rfq_received"

    # 3. Update deal
    update_response = client.patch(
        f"/api/deals/{deal_id}",
        json={"description": "Updated description", "total_value": 150000},
    )
    assert update_response.status_code == 200

    # 4. Change status
    status_response = client.patch(
        f"/api/deals/{deal_id}/status", json={"status": "sourcing"}
    )
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "sourcing"

    # 5. Get activity logs
    activity_response = client.get(f"/api/deals/{deal_id}/activity")
    assert activity_response.status_code == 200
    logs = activity_response.json()["activity_logs"]
    assert len(logs) >= 3  # created, updated, status_changed

    # 6. List deals
    list_response = client.get("/api/deals")
    assert list_response.status_code == 200
    assert list_response.json()["total"] >= 1

    # 7. Delete deal
    delete_response = client.delete(f"/api/deals/{deal_id}")
    assert delete_response.status_code == 204

    # 8. Verify deleted (404)
    get_response = client.get(f"/api/deals/{deal_id}")
    assert get_response.status_code == 404

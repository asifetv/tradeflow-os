"""API endpoints for customer PO management."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.deps import CurrentUserDep, SessionDep
from app.models.customer_po import CustomerPOStatus
from app.schemas.customer_po import (
    CustomerPOCreate,
    CustomerPOsListResponse,
    CustomerPOResponse,
    CustomerPOStatusUpdate,
    CustomerPOUpdate,
)
from app.services.customer_po import CustomerPOService

router = APIRouter(
    prefix="/api/customer-pos",
    tags=["customer_pos"],
)


@router.post("", response_model=CustomerPOResponse, status_code=status.HTTP_201_CREATED)
async def create_customer_po(
    po_data: CustomerPOCreate,
    db: SessionDep,
    user_id: CurrentUserDep,
):
    """Create a new customer PO."""
    service = CustomerPOService(db, user_id=user_id)
    customer_po = await service.create_customer_po(po_data)
    await db.commit()
    return customer_po


@router.get("", response_model=CustomerPOsListResponse)
async def list_customer_pos(
    db: SessionDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    customer_id: Optional[UUID] = Query(None),
    deal_id: Optional[UUID] = Query(None),
    quote_id: Optional[UUID] = Query(None),
    status: Optional[CustomerPOStatus] = Query(None),
):
    """List customer POs with optional filters."""
    service = CustomerPOService(db)
    return await service.list_customer_pos(
        skip=skip,
        limit=limit,
        customer_id=customer_id,
        deal_id=deal_id,
        quote_id=quote_id,
        status=status,
    )


@router.get("/{po_id}", response_model=CustomerPOResponse)
async def get_customer_po(
    po_id: UUID,
    db: SessionDep,
):
    """Get customer PO detail."""
    service = CustomerPOService(db)
    customer_po = await service.get_customer_po(po_id)

    if not customer_po:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer PO {po_id} not found",
        )

    return customer_po


@router.patch("/{po_id}", response_model=CustomerPOResponse)
async def update_customer_po(
    po_id: UUID,
    update_data: CustomerPOUpdate,
    db: SessionDep,
    user_id: CurrentUserDep,
):
    """Update a customer PO."""
    service = CustomerPOService(db, user_id=user_id)
    customer_po = await service.update_customer_po(po_id, update_data)

    if not customer_po:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer PO {po_id} not found",
        )

    await db.commit()
    return customer_po


@router.patch("/{po_id}/status", response_model=CustomerPOResponse)
async def update_customer_po_status(
    po_id: UUID,
    status_data: CustomerPOStatusUpdate,
    db: SessionDep,
    user_id: CurrentUserDep,
):
    """Update customer PO status with state machine validation."""
    service = CustomerPOService(db, user_id=user_id)

    try:
        customer_po = await service.update_customer_po_status(po_id, status_data.status)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    if not customer_po:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer PO {po_id} not found",
        )

    await db.commit()
    return customer_po


@router.delete("/{po_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer_po(
    po_id: UUID,
    db: SessionDep,
    user_id: CurrentUserDep,
):
    """Soft delete a customer PO."""
    service = CustomerPOService(db, user_id=user_id)
    deleted = await service.delete_customer_po(po_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer PO {po_id} not found",
        )

    await db.commit()

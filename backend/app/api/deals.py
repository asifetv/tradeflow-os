"""API endpoints for deal management."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.deps import CurrentUserDep, SessionDep
from app.models.deal import DealStatus
from app.schemas.deal import (
    DealCreate,
    DealListResponse,
    DealResponse,
    DealStatusUpdate,
    DealUpdate,
)
from app.schemas.activity_log import DealActivityListResponse
from app.services.deal import DealService

router = APIRouter(
    prefix="/api/deals",
    tags=["deals"],
)


@router.post("", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
async def create_deal(
    deal_data: DealCreate,
    db: SessionDep,
    user_id: CurrentUserDep,
):
    """Create a new deal."""
    service = DealService(db, user_id=user_id)
    deal = await service.create_deal(deal_data)
    await db.commit()
    return deal


@router.get("", response_model=DealListResponse)
async def list_deals(
    db: SessionDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[DealStatus] = Query(None),
    customer_id: Optional[UUID] = Query(None),
):
    """List deals with optional filters."""
    service = DealService(db)
    return await service.list_deals(
        skip=skip,
        limit=limit,
        status=status,
        customer_id=customer_id,
    )


@router.get("/{deal_id}", response_model=DealResponse)
async def get_deal(
    deal_id: UUID,
    db: SessionDep,
):
    """Get deal detail."""
    service = DealService(db)
    deal = await service.get_deal(deal_id)

    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deal {deal_id} not found",
        )

    return deal


@router.patch("/{deal_id}", response_model=DealResponse)
async def update_deal(
    deal_id: UUID,
    update_data: DealUpdate,
    db: SessionDep,
    user_id: CurrentUserDep,
):
    """Update a deal."""
    service = DealService(db, user_id=user_id)
    deal = await service.update_deal(deal_id, update_data)

    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deal {deal_id} not found",
        )

    await db.commit()
    return deal


@router.patch("/{deal_id}/status", response_model=DealResponse)
async def update_deal_status(
    deal_id: UUID,
    status_update: DealStatusUpdate,
    db: SessionDep,
    user_id: CurrentUserDep,
):
    """Update deal status with state machine validation."""
    service = DealService(db, user_id=user_id)

    try:
        deal = await service.update_deal_status(deal_id, status_update.status)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deal {deal_id} not found",
        )

    await db.commit()
    return deal


@router.delete("/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deal(
    deal_id: UUID,
    db: SessionDep,
    user_id: CurrentUserDep,
):
    """Soft delete a deal."""
    service = DealService(db, user_id=user_id)
    deleted = await service.delete_deal(deal_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deal {deal_id} not found",
        )

    await db.commit()


@router.get("/{deal_id}/activity", response_model=DealActivityListResponse)
async def get_deal_activity(
    deal_id: UUID,
    db: SessionDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get activity logs for a deal."""
    service = DealService(db)
    # Verify deal exists first
    deal = await service.get_deal(deal_id)
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deal {deal_id} not found",
        )

    logs, total = await service.activity_log_service.get_deal_activity_logs(
        deal_id, skip=skip, limit=limit
    )

    return DealActivityListResponse(activity_logs=logs, total=total)

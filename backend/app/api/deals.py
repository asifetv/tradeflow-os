"""API endpoints for deal management."""
import traceback
from typing import Optional
from uuid import UUID

import structlog
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

logger = structlog.get_logger(__name__)

router = APIRouter(
    prefix="/api/deals",
    tags=["deals"],
)


@router.post("", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
async def create_deal(
    deal_data: DealCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Create a new deal."""
    try:
        logger.info("Creating deal", user_id=str(current_user["user_id"]), company_id=str(current_user["company_id"]))
        service = DealService(
            db,
            user_id=current_user["user_id"],
            company_id=current_user["company_id"]
        )
        deal = await service.create_deal(deal_data)
        await db.commit()
        logger.info("Deal created successfully", deal_number=deal.deal_number)
        return deal
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error("Failed to create deal", error=str(e), traceback=traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create deal: {str(e)}",
        )


@router.get("", response_model=DealListResponse)
async def list_deals(
    db: SessionDep,
    current_user: CurrentUserDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[DealStatus] = Query(None),
    customer_id: Optional[UUID] = Query(None),
):
    """List deals with optional filters."""
    try:
        service = DealService(
            db,
            user_id=current_user["user_id"],
            company_id=current_user["company_id"]
        )
        return await service.list_deals(
            skip=skip,
            limit=limit,
            status=status,
            customer_id=customer_id,
        )
    except Exception as e:
        logger.error("Failed to list deals", error=str(e), traceback=traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list deals: {str(e)}",
        )


@router.get("/{deal_id}", response_model=DealResponse)
async def get_deal(
    deal_id: UUID,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Get deal detail."""
    try:
        service = DealService(
            db,
            user_id=current_user["user_id"],
            company_id=current_user["company_id"]
        )
        deal = await service.get_deal(deal_id)

        if not deal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Deal {deal_id} not found",
            )

        return deal
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get deal", error=str(e), traceback=traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get deal: {str(e)}",
        )


@router.patch("/{deal_id}", response_model=DealResponse)
async def update_deal(
    deal_id: UUID,
    update_data: DealUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Update a deal."""
    try:
        service = DealService(
            db,
            user_id=current_user["user_id"],
            company_id=current_user["company_id"]
        )
        deal = await service.update_deal(deal_id, update_data)

        if not deal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Deal {deal_id} not found",
            )

        await db.commit()
        return deal
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error("Failed to update deal", error=str(e), traceback=traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update deal: {str(e)}",
        )


@router.patch("/{deal_id}/status", response_model=DealResponse)
async def update_deal_status(
    deal_id: UUID,
    status_update: DealStatusUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Update deal status with state machine validation."""
    try:
        service = DealService(
            db,
            user_id=current_user["user_id"],
            company_id=current_user["company_id"]
        )

        deal = await service.update_deal_status(deal_id, status_update.status)

        if not deal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Deal {deal_id} not found",
            )

        await db.commit()
        return deal
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error("Failed to update deal status", error=str(e), traceback=traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update deal status: {str(e)}",
        )


@router.delete("/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deal(
    deal_id: UUID,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Soft delete a deal."""
    try:
        service = DealService(
            db,
            user_id=current_user["user_id"],
            company_id=current_user["company_id"]
        )
        deleted = await service.delete_deal(deal_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Deal {deal_id} not found",
            )

        await db.commit()
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error("Failed to delete deal", error=str(e), traceback=traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete deal: {str(e)}",
        )


@router.get("/{deal_id}/activity", response_model=DealActivityListResponse)
async def get_deal_activity(
    deal_id: UUID,
    db: SessionDep,
    current_user: CurrentUserDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get activity logs for a deal."""
    try:
        service = DealService(
            db,
            user_id=current_user["user_id"],
            company_id=current_user["company_id"]
        )
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get deal activity", error=str(e), traceback=traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get deal activity: {str(e)}",
        )

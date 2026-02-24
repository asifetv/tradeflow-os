"""Deal service with state machine logic."""
from typing import Any, Dict, Optional, Tuple, Union
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.deal import Deal, DealStatus
from app.schemas.deal import (
    DealCreate,
    DealListResponse,
    DealResponse,
    DealUpdate,
)
from app.schemas.activity_log import ChangeDetail
from app.services.activity_log import ActivityLogService


# State machine: valid transitions
VALID_STATUS_TRANSITIONS = {
    DealStatus.RFQ_RECEIVED: [
        DealStatus.SOURCING,
        DealStatus.QUOTED,
        DealStatus.CANCELLED,
    ],
    DealStatus.SOURCING: [DealStatus.QUOTED, DealStatus.CANCELLED],
    DealStatus.QUOTED: [
        DealStatus.PO_RECEIVED,
        DealStatus.SOURCING,
        DealStatus.CANCELLED,
    ],
    DealStatus.PO_RECEIVED: [DealStatus.ORDERED, DealStatus.CANCELLED],
    DealStatus.ORDERED: [DealStatus.IN_PRODUCTION, DealStatus.CANCELLED],
    DealStatus.IN_PRODUCTION: [DealStatus.SHIPPED, DealStatus.CANCELLED],
    DealStatus.SHIPPED: [DealStatus.DELIVERED, DealStatus.CANCELLED],
    DealStatus.DELIVERED: [DealStatus.INVOICED, DealStatus.CANCELLED],
    DealStatus.INVOICED: [DealStatus.PAID, DealStatus.CANCELLED],
    DealStatus.PAID: [DealStatus.CLOSED],
    DealStatus.CLOSED: [],
    DealStatus.CANCELLED: [],
}


class DealService:
    """Service for deal CRUD operations and state management."""

    def __init__(
        self,
        db: AsyncSession,
        user_id: Optional[Union[str, UUID]] = None,
        company_id: Optional[UUID] = None,
    ):
        self.db = db
        self.user_id = user_id
        self.company_id = company_id
        self.activity_log_service = ActivityLogService(db, company_id=company_id)

    async def create_deal(self, deal_data: DealCreate) -> DealResponse:
        """
        Create a new deal.

        Args:
            deal_data: Deal creation data

        Returns:
            Created deal response
        """
        # Auto-generate deal_number if not provided
        deal_number = deal_data.deal_number
        if not deal_number:
            deal_number = await self._generate_deal_number()

        # Convert line items to list of dicts
        line_items_dict = [item.model_dump() for item in deal_data.line_items]

        # Try to convert user_id to UUID, otherwise leave as None
        created_by_id = None
        if self.user_id:
            try:
                if isinstance(self.user_id, UUID):
                    created_by_id = self.user_id
                else:
                    created_by_id = UUID(self.user_id)
            except (ValueError, AttributeError):
                # user_id is not a valid UUID (e.g., "test-user"), skip it
                pass

        deal = Deal(
            company_id=self.company_id,
            deal_number=deal_number,
            customer_id=deal_data.customer_id,
            customer_rfq_ref=deal_data.customer_rfq_ref,
            description=deal_data.description,
            currency=deal_data.currency,
            line_items=line_items_dict,
            total_value=deal_data.total_value,
            total_cost=deal_data.total_cost,
            estimated_margin_pct=deal_data.estimated_margin_pct,
            notes=deal_data.notes,
            created_by_id=created_by_id,
            status=DealStatus.RFQ_RECEIVED,  # Default status
        )

        self.db.add(deal)
        await self.db.flush()
        await self.db.refresh(deal)

        # Log creation
        await self.activity_log_service.log_activity(
            deal_id=deal.id,
            action="created",
            entity_type="deal",
            entity_id=deal.id,
            user_id=self.user_id,
            company_id=self.company_id,
        )

        return DealResponse.model_validate(deal)

    async def get_deal(self, deal_id: UUID) -> Optional[DealResponse]:
        """
        Get a deal by ID (excludes soft-deleted).

        Args:
            deal_id: Deal ID

        Returns:
            Deal response or None if not found
        """
        query = select(Deal).where(
            (Deal.id == deal_id)
            & (Deal.deleted_at.is_(None))
            & (Deal.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        deal = result.scalars().first()

        return DealResponse.model_validate(deal) if deal else None

    async def list_deals(
        self,
        skip: int = 0,
        limit: int = 50,
        status: Optional[DealStatus] = None,
        customer_id: Optional[UUID] = None,
    ) -> DealListResponse:
        """
        List deals with optional filters.

        Args:
            skip: Number of records to skip
            limit: Max records to return
            status: Filter by status
            customer_id: Filter by customer

        Returns:
            Paginated list response
        """
        # Build base query (exclude soft-deleted, filter by company)
        query = select(Deal).where(
            (Deal.deleted_at.is_(None)) & (Deal.company_id == self.company_id)
        )

        # Apply filters
        if status:
            query = query.where(Deal.status == status)
        if customer_id:
            query = query.where(Deal.customer_id == customer_id)

        # Get total count
        count_query = select(func.count()).select_from(Deal).where(
            (Deal.deleted_at.is_(None)) & (Deal.company_id == self.company_id)
        )
        if status:
            count_query = count_query.where(Deal.status == status)
        if customer_id:
            count_query = count_query.where(Deal.customer_id == customer_id)
        count_result = await self.db.execute(count_query)

        total = count_result.scalar() or 0

        # Get paginated results, ordered by created_at DESC
        query = (
            query.order_by(Deal.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        deals = result.scalars().all()

        return DealListResponse(
            deals=[DealResponse.model_validate(deal) for deal in deals],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def update_deal(
        self, deal_id: UUID, update_data: DealUpdate
    ) -> DealResponse:
        """
        Update a deal and log changes.

        Args:
            deal_id: Deal ID
            update_data: Partial update data

        Returns:
            Updated deal response
        """
        # Get existing deal
        deal = await self._get_deal_internal(deal_id)
        if not deal:
            return None

        # Capture old values
        old_values = {
            "deal_number": deal.deal_number,
            "customer_id": str(deal.customer_id) if deal.customer_id else None,
            "customer_rfq_ref": deal.customer_rfq_ref,
            "description": deal.description,
            "currency": deal.currency,
            "total_value": deal.total_value,
            "total_cost": deal.total_cost,
            "estimated_margin_pct": deal.estimated_margin_pct,
            "notes": deal.notes,
        }

        # Update fields
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            if field == "line_items" and value is not None:
                # Handle both Pydantic models and plain dicts
                line_items_list = []
                for item in value:
                    if hasattr(item, 'model_dump'):
                        line_items_list.append(item.model_dump())
                    elif isinstance(item, dict):
                        line_items_list.append(item)
                    else:
                        line_items_list.append(item)
                setattr(deal, field, line_items_list)
            else:
                setattr(deal, field, value)

        await self.db.flush()
        await self.db.refresh(deal)

        # Compute changes
        new_values = {
            "deal_number": deal.deal_number,
            "customer_id": str(deal.customer_id) if deal.customer_id else None,
            "customer_rfq_ref": deal.customer_rfq_ref,
            "description": deal.description,
            "currency": deal.currency,
            "total_value": deal.total_value,
            "total_cost": deal.total_cost,
            "estimated_margin_pct": deal.estimated_margin_pct,
            "notes": deal.notes,
        }

        changes = ActivityLogService.compute_changes(old_values, new_values)

        if changes:
            await self.activity_log_service.log_activity(
                deal_id=deal.id,
                action="updated",
                entity_type="deal",
                entity_id=deal.id,
                changes=changes,
                user_id=self.user_id,
                company_id=self.company_id,
            )

        return DealResponse.model_validate(deal)

    async def update_deal_status(
        self, deal_id: UUID, new_status: DealStatus
    ) -> DealResponse:
        """
        Update deal status with state machine validation.

        Args:
            deal_id: Deal ID
            new_status: New status

        Returns:
            Updated deal response

        Raises:
            ValueError: If transition is not valid
        """
        # Get existing deal
        deal = await self._get_deal_internal(deal_id)
        if not deal:
            return None

        current_status = deal.status

        # Validate transition
        if new_status not in VALID_STATUS_TRANSITIONS.get(current_status, []):
            raise ValueError(
                f"Invalid status transition from {current_status} to {new_status}"
            )

        # Update status
        deal.status = new_status
        await self.db.flush()
        await self.db.refresh(deal)

        # Log status change
        await self.activity_log_service.log_activity(
            deal_id=deal.id,
            action="status_changed",
            entity_type="deal",
            entity_id=deal.id,
            changes=[
                ChangeDetail(
                    field="status",
                    old_value=str(current_status),
                    new_value=str(new_status),
                )
            ],
            user_id=self.user_id,
            company_id=self.company_id,
        )

        return DealResponse.model_validate(deal)

    async def delete_deal(self, deal_id: UUID) -> bool:
        """
        Soft delete a deal.

        Args:
            deal_id: Deal ID

        Returns:
            True if deleted, False if not found
        """
        deal = await self._get_deal_internal(deal_id)
        if not deal:
            return False

        from datetime import datetime, timezone
        deal.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(deal)

        # Log deletion
        await self.activity_log_service.log_activity(
            deal_id=deal.id,
            action="deleted",
            entity_type="deal",
            entity_id=deal.id,
            user_id=self.user_id,
            company_id=self.company_id,
        )

        return True

    async def _generate_deal_number(self) -> str:
        """
        Generate a unique deal number (DEAL-001, DEAL-002, etc.).

        Returns:
            Generated deal number
        """
        # Get all existing deal numbers for this company (including soft-deleted)
        query = select(Deal.deal_number).where(
            Deal.company_id == self.company_id
        ).order_by(Deal.deal_number.desc())
        result = await self.db.execute(query)
        deal_numbers = result.scalars().all()

        # Extract numeric parts and find maximum
        max_num = 0
        for deal_num in deal_numbers:
            if deal_num and deal_num.startswith("DEAL-"):
                try:
                    num = int(deal_num.split("-")[1])
                    max_num = max(max_num, num)
                except (ValueError, IndexError):
                    pass

        # Generate next number
        next_num = max_num + 1
        return f"DEAL-{next_num:03d}"

    async def _get_deal_internal(self, deal_id: UUID) -> Optional[Deal]:
        """Internal method to get deal (excludes soft-deleted, filters by company)."""
        query = select(Deal).where(
            (Deal.id == deal_id)
            & (Deal.deleted_at.is_(None))
            & (Deal.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        return result.scalars().first()

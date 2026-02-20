"""CustomerPO service for purchase order management with state machine logic."""
from typing import Optional, Union
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer_po import CustomerPO, CustomerPOStatus
from app.schemas.customer_po import (
    CustomerPOCreate,
    CustomerPOsListResponse,
    CustomerPOResponse,
    CustomerPOUpdate,
)
from app.schemas.activity_log import ChangeDetail
from app.services.activity_log import ActivityLogService


# State machine: valid transitions
VALID_CUSTOMER_PO_STATUS_TRANSITIONS = {
    CustomerPOStatus.RECEIVED: [CustomerPOStatus.ACKNOWLEDGED, CustomerPOStatus.CANCELLED],
    CustomerPOStatus.ACKNOWLEDGED: [CustomerPOStatus.IN_PROGRESS, CustomerPOStatus.CANCELLED],
    CustomerPOStatus.IN_PROGRESS: [CustomerPOStatus.FULFILLED, CustomerPOStatus.CANCELLED],
    CustomerPOStatus.FULFILLED: [],
    CustomerPOStatus.CANCELLED: [],
}


class CustomerPOService:
    """Service for customer PO CRUD operations and state management."""

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

    async def create_customer_po(self, po_data: CustomerPOCreate) -> CustomerPOResponse:
        """
        Create a new customer PO.

        Args:
            po_data: CustomerPO creation data

        Returns:
            Created customer PO response
        """
        # Auto-generate internal_ref if not provided
        internal_ref = po_data.internal_ref
        if not internal_ref:
            internal_ref = await self._generate_internal_ref()

        # Convert line items to list of dicts
        line_items_dict = [item.model_dump() for item in po_data.line_items]

        customer_po = CustomerPO(
            company_id=self.company_id,
            internal_ref=internal_ref,
            po_number=po_data.po_number,
            customer_id=po_data.customer_id,
            deal_id=po_data.deal_id,
            quote_id=po_data.quote_id,
            line_items=line_items_dict,
            total_amount=po_data.total_amount,
            currency=po_data.currency,
            po_date=po_data.po_date,
            delivery_date=po_data.delivery_date,
            notes=po_data.notes,
            status=CustomerPOStatus.RECEIVED,
        )

        self.db.add(customer_po)
        await self.db.flush()
        await self.db.refresh(customer_po)

        # Log creation
        await self.activity_log_service.log_activity(
            deal_id=po_data.deal_id,
            action="created",
            entity_type="customer_po",
            entity_id=customer_po.id,
            user_id=self.user_id,
            company_id=self.company_id,
        )

        return CustomerPOResponse.model_validate(customer_po)

    async def get_customer_po(self, po_id: UUID) -> Optional[CustomerPOResponse]:
        """
        Get a customer PO by ID (excludes soft-deleted).

        Args:
            po_id: CustomerPO ID

        Returns:
            CustomerPO response or None if not found
        """
        query = select(CustomerPO).where(
            (CustomerPO.id == po_id)
            & (CustomerPO.deleted_at.is_(None))
            & (CustomerPO.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        customer_po = result.scalars().first()

        return CustomerPOResponse.model_validate(customer_po) if customer_po else None

    async def list_customer_pos(
        self,
        skip: int = 0,
        limit: int = 50,
        customer_id: Optional[UUID] = None,
        deal_id: Optional[UUID] = None,
        quote_id: Optional[UUID] = None,
        status: Optional[CustomerPOStatus] = None,
    ) -> CustomerPOsListResponse:
        """
        List customer POs with optional filters.

        Args:
            skip: Number of records to skip
            limit: Max records to return
            customer_id: Filter by customer
            deal_id: Filter by deal
            quote_id: Filter by quote
            status: Filter by status

        Returns:
            Paginated list response
        """
        # Build base query (exclude soft-deleted, filter by company)
        query = select(CustomerPO).where(
            (CustomerPO.deleted_at.is_(None)) & (CustomerPO.company_id == self.company_id)
        )

        # Apply filters
        if customer_id:
            query = query.where(CustomerPO.customer_id == customer_id)
        if deal_id:
            query = query.where(CustomerPO.deal_id == deal_id)
        if quote_id:
            query = query.where(CustomerPO.quote_id == quote_id)
        if status:
            query = query.where(CustomerPO.status == status)

        # Get total count
        count_query = select(func.count()).select_from(CustomerPO).where(
            (CustomerPO.deleted_at.is_(None)) & (CustomerPO.company_id == self.company_id)
        )
        if customer_id:
            count_query = count_query.where(CustomerPO.customer_id == customer_id)
        if deal_id:
            count_query = count_query.where(CustomerPO.deal_id == deal_id)
        if quote_id:
            count_query = count_query.where(CustomerPO.quote_id == quote_id)
        if status:
            count_query = count_query.where(CustomerPO.status == status)

        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        # Get paginated results, ordered by created_at DESC
        query = (
            query.order_by(CustomerPO.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        customer_pos = result.scalars().all()

        return CustomerPOsListResponse(
            customer_pos=[CustomerPOResponse.model_validate(po) for po in customer_pos],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def update_customer_po(
        self, po_id: UUID, update_data: CustomerPOUpdate
    ) -> Optional[CustomerPOResponse]:
        """
        Update a customer PO and log changes.

        Args:
            po_id: CustomerPO ID
            update_data: Partial update data

        Returns:
            Updated customer PO response or None if not found
        """
        # Get existing PO
        customer_po = await self._get_customer_po_internal(po_id)
        if not customer_po:
            return None

        # Capture old values
        old_values = {
            "internal_ref": customer_po.internal_ref,
            "po_number": customer_po.po_number,
            "customer_id": str(customer_po.customer_id),
            "deal_id": str(customer_po.deal_id) if customer_po.deal_id else None,
            "quote_id": str(customer_po.quote_id) if customer_po.quote_id else None,
            "total_amount": customer_po.total_amount,
            "currency": customer_po.currency,
            "po_date": str(customer_po.po_date),
            "delivery_date": str(customer_po.delivery_date) if customer_po.delivery_date else None,
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
                setattr(customer_po, field, line_items_list)
            else:
                setattr(customer_po, field, value)

        await self.db.flush()
        await self.db.refresh(customer_po)

        # Compute changes
        new_values = {
            "internal_ref": customer_po.internal_ref,
            "po_number": customer_po.po_number,
            "customer_id": str(customer_po.customer_id),
            "deal_id": str(customer_po.deal_id) if customer_po.deal_id else None,
            "quote_id": str(customer_po.quote_id) if customer_po.quote_id else None,
            "total_amount": customer_po.total_amount,
            "currency": customer_po.currency,
            "po_date": str(customer_po.po_date),
            "delivery_date": str(customer_po.delivery_date) if customer_po.delivery_date else None,
        }

        changes = ActivityLogService.compute_changes(old_values, new_values)

        if changes:
            await self.activity_log_service.log_activity(
                deal_id=customer_po.deal_id,
                action="updated",
                entity_type="customer_po",
                entity_id=customer_po.id,
                changes=changes,
                user_id=self.user_id,
                company_id=self.company_id,
            )

        return CustomerPOResponse.model_validate(customer_po)

    async def update_customer_po_status(
        self, po_id: UUID, new_status: CustomerPOStatus
    ) -> Optional[CustomerPOResponse]:
        """
        Update customer PO status with state machine validation.
        Auto-updates deal status to PO_RECEIVED when PO is acknowledged.

        Args:
            po_id: CustomerPO ID
            new_status: New status

        Returns:
            Updated customer PO response or None if not found

        Raises:
            ValueError: If transition is not valid
        """
        # Get existing PO
        customer_po = await self._get_customer_po_internal(po_id)
        if not customer_po:
            return None

        current_status = customer_po.status

        # Validate transition
        if new_status not in VALID_CUSTOMER_PO_STATUS_TRANSITIONS.get(current_status, []):
            raise ValueError(
                f"Invalid status transition from {current_status} to {new_status}"
            )

        # Update status
        customer_po.status = new_status
        await self.db.flush()
        await self.db.refresh(customer_po)

        # Log status change
        await self.activity_log_service.log_activity(
            deal_id=customer_po.deal_id,
            action="status_changed",
            entity_type="customer_po",
            entity_id=customer_po.id,
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

        # Auto-update deal status based on PO status transitions
        if customer_po.deal_id:
            # Import here to avoid circular imports
            from app.models.deal import Deal, DealStatus
            from app.services.deal import VALID_STATUS_TRANSITIONS

            # Get the deal (filter by company)
            deal_query = select(Deal).where(
                (Deal.id == customer_po.deal_id)
                & (Deal.deleted_at.is_(None))
                & (Deal.company_id == self.company_id)
            )
            deal_result = await self.db.execute(deal_query)
            deal = deal_result.scalars().first()

            if deal:
                # Smart status progression: only move to next valid stage if available
                target_deal_status = None
                valid_transitions = VALID_STATUS_TRANSITIONS.get(deal.status, [])

                # Determine target status based on PO status and current deal status
                if new_status == CustomerPOStatus.ACKNOWLEDGED:
                    # Move to PO_RECEIVED when PO is acknowledged
                    target_deal_status = DealStatus.PO_RECEIVED if DealStatus.PO_RECEIVED in valid_transitions else None

                elif new_status == CustomerPOStatus.IN_PROGRESS:
                    # Move to next logical status: ORDERED or IN_PRODUCTION depending on current status
                    if deal.status == DealStatus.PO_RECEIVED:
                        target_deal_status = DealStatus.ORDERED if DealStatus.ORDERED in valid_transitions else None
                    elif deal.status == DealStatus.ORDERED:
                        target_deal_status = DealStatus.IN_PRODUCTION if DealStatus.IN_PRODUCTION in valid_transitions else None

                elif new_status == CustomerPOStatus.FULFILLED:
                    # Move to SHIPPED or DELIVERED depending on current status
                    if deal.status == DealStatus.IN_PRODUCTION:
                        target_deal_status = DealStatus.SHIPPED if DealStatus.SHIPPED in valid_transitions else None
                    elif deal.status == DealStatus.SHIPPED:
                        target_deal_status = DealStatus.DELIVERED if DealStatus.DELIVERED in valid_transitions else None

                # If there's a target status, update the deal
                if target_deal_status:
                    # Auto-update deal status
                    old_deal_status = deal.status
                    deal.status = target_deal_status
                    await self.db.flush()
                    await self.db.refresh(deal)

                    # Log deal auto-update
                    await self.activity_log_service.log_activity(
                        deal_id=deal.id,
                        action="auto_status_changed",
                        entity_type="deal",
                        entity_id=deal.id,
                        changes=[
                            ChangeDetail(
                                field="status",
                                old_value=str(old_deal_status),
                                new_value=str(target_deal_status),
                            )
                        ],
                        user_id=self.user_id,
                        company_id=self.company_id,
                    )

        return CustomerPOResponse.model_validate(customer_po)

    async def delete_customer_po(self, po_id: UUID) -> bool:
        """
        Soft delete a customer PO.

        Args:
            po_id: CustomerPO ID

        Returns:
            True if deleted, False if not found
        """
        customer_po = await self._get_customer_po_internal(po_id)
        if not customer_po:
            return False

        from datetime import datetime, timezone
        customer_po.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(customer_po)

        # Log deletion
        await self.activity_log_service.log_activity(
            deal_id=customer_po.deal_id,
            action="deleted",
            entity_type="customer_po",
            entity_id=customer_po.id,
            user_id=self.user_id,
            company_id=self.company_id,
        )

        return True

    async def _generate_internal_ref(self) -> str:
        """
        Generate a unique internal reference (CPO-2024-001, CPO-2024-002, etc.).

        Returns:
            Generated internal reference
        """
        from datetime import datetime

        # Get the maximum numeric part of customer POs from current year for this company
        current_year = datetime.now().year
        query = select(func.count(CustomerPO.id)).where(
            (CustomerPO.deleted_at.is_(None)) & (CustomerPO.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        count = result.scalar() or 0

        # Generate next number
        next_num = count + 1
        return f"CPO-{current_year}-{next_num:03d}"

    async def _get_customer_po_internal(self, po_id: UUID) -> Optional[CustomerPO]:
        """Internal method to get customer PO (excludes soft-deleted, filters by company)."""
        query = select(CustomerPO).where(
            (CustomerPO.id == po_id)
            & (CustomerPO.deleted_at.is_(None))
            & (CustomerPO.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        return result.scalars().first()

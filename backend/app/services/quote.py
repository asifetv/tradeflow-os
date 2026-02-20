"""Quote service for quote management with state machine logic."""
from typing import Optional, Union
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.quote import Quote, QuoteStatus
from app.schemas.quote import (
    QuoteCreate,
    QuotesListResponse,
    QuoteResponse,
    QuoteUpdate,
)
from app.schemas.activity_log import ChangeDetail
from app.services.activity_log import ActivityLogService


# State machine: valid transitions
VALID_QUOTE_STATUS_TRANSITIONS = {
    QuoteStatus.DRAFT: [QuoteStatus.SENT, QuoteStatus.EXPIRED],
    QuoteStatus.SENT: [QuoteStatus.ACCEPTED, QuoteStatus.REJECTED, QuoteStatus.REVISED, QuoteStatus.EXPIRED],
    QuoteStatus.ACCEPTED: [],
    QuoteStatus.REJECTED: [QuoteStatus.REVISED],
    QuoteStatus.EXPIRED: [QuoteStatus.REVISED],
    QuoteStatus.REVISED: [QuoteStatus.SENT],
}


class QuoteService:
    """Service for quote CRUD operations and state management."""

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

    async def create_quote(self, quote_data: QuoteCreate) -> QuoteResponse:
        """
        Create a new quote.

        Args:
            quote_data: Quote creation data

        Returns:
            Created quote response
        """
        # Auto-generate quote_number if not provided
        quote_number = quote_data.quote_number
        if not quote_number:
            quote_number = await self._generate_quote_number()

        # Convert line items to list of dicts
        line_items_dict = [item.model_dump() for item in quote_data.line_items]

        quote = Quote(
            company_id=self.company_id,
            quote_number=quote_number,
            customer_id=quote_data.customer_id,
            deal_id=quote_data.deal_id,
            title=quote_data.title,
            description=quote_data.description,
            line_items=line_items_dict,
            total_amount=quote_data.total_amount,
            currency=quote_data.currency,
            payment_terms=quote_data.payment_terms,
            delivery_terms=quote_data.delivery_terms,
            validity_days=quote_data.validity_days,
            issue_date=quote_data.issue_date,
            expiry_date=quote_data.expiry_date,
            notes=quote_data.notes,
            status=QuoteStatus.DRAFT,
        )

        self.db.add(quote)
        await self.db.flush()
        await self.db.refresh(quote)

        # Auto-update deal status to QUOTED if deal_id is set
        if quote_data.deal_id:
            from app.models.deal import Deal, DealStatus
            from app.services.deal import VALID_STATUS_TRANSITIONS

            # Get the deal (filter by company)
            deal_query = select(Deal).where(
                (Deal.id == quote_data.deal_id)
                & (Deal.deleted_at.is_(None))
                & (Deal.company_id == self.company_id)
            )
            deal_result = await self.db.execute(deal_query)
            deal = deal_result.scalars().first()

            if deal:
                # Try to move to QUOTED if it's a valid transition
                valid_transitions = VALID_STATUS_TRANSITIONS.get(deal.status, [])
                if DealStatus.QUOTED in valid_transitions:
                    old_deal_status = deal.status
                    deal.status = DealStatus.QUOTED
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
                                new_value=str(DealStatus.QUOTED),
                            )
                        ],
                        user_id=self.user_id,
                        company_id=self.company_id,
                    )

        # Log creation
        await self.activity_log_service.log_activity(
            deal_id=quote_data.deal_id,
            action="created",
            entity_type="quote",
            entity_id=quote.id,
            user_id=self.user_id,
            company_id=self.company_id,
        )

        return QuoteResponse.model_validate(quote)

    async def get_quote(self, quote_id: UUID) -> Optional[QuoteResponse]:
        """
        Get a quote by ID (excludes soft-deleted).

        Args:
            quote_id: Quote ID

        Returns:
            Quote response or None if not found
        """
        query = select(Quote).where(
            (Quote.id == quote_id)
            & (Quote.deleted_at.is_(None))
            & (Quote.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        quote = result.scalars().first()

        return QuoteResponse.model_validate(quote) if quote else None

    async def list_quotes(
        self,
        skip: int = 0,
        limit: int = 50,
        customer_id: Optional[UUID] = None,
        deal_id: Optional[UUID] = None,
        status: Optional[QuoteStatus] = None,
    ) -> QuotesListResponse:
        """
        List quotes with optional filters.

        Args:
            skip: Number of records to skip
            limit: Max records to return
            customer_id: Filter by customer
            deal_id: Filter by deal
            status: Filter by status

        Returns:
            Paginated list response
        """
        # Build base query (exclude soft-deleted, filter by company)
        query = select(Quote).where(
            (Quote.deleted_at.is_(None)) & (Quote.company_id == self.company_id)
        )

        # Apply filters
        if customer_id:
            query = query.where(Quote.customer_id == customer_id)
        if deal_id:
            query = query.where(Quote.deal_id == deal_id)
        if status:
            query = query.where(Quote.status == status)

        # Get total count
        count_query = select(func.count()).select_from(Quote).where(
            (Quote.deleted_at.is_(None)) & (Quote.company_id == self.company_id)
        )
        if customer_id:
            count_query = count_query.where(Quote.customer_id == customer_id)
        if deal_id:
            count_query = count_query.where(Quote.deal_id == deal_id)
        if status:
            count_query = count_query.where(Quote.status == status)

        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        # Get paginated results, ordered by created_at DESC
        query = (
            query.order_by(Quote.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        quotes = result.scalars().all()

        return QuotesListResponse(
            quotes=[QuoteResponse.model_validate(quote) for quote in quotes],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def update_quote(
        self, quote_id: UUID, update_data: QuoteUpdate
    ) -> Optional[QuoteResponse]:
        """
        Update a quote and log changes.

        Args:
            quote_id: Quote ID
            update_data: Partial update data

        Returns:
            Updated quote response or None if not found
        """
        # Get existing quote
        quote = await self._get_quote_internal(quote_id)
        if not quote:
            return None

        # Capture old values
        old_values = {
            "quote_number": quote.quote_number,
            "customer_id": str(quote.customer_id),
            "deal_id": str(quote.deal_id) if quote.deal_id else None,
            "title": quote.title,
            "total_amount": quote.total_amount,
            "currency": quote.currency,
            "payment_terms": quote.payment_terms,
            "delivery_terms": quote.delivery_terms,
            "validity_days": quote.validity_days,
            "notes": quote.notes,
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
                setattr(quote, field, line_items_list)
            else:
                setattr(quote, field, value)

        await self.db.flush()
        await self.db.refresh(quote)

        # Compute changes
        new_values = {
            "quote_number": quote.quote_number,
            "customer_id": str(quote.customer_id),
            "deal_id": str(quote.deal_id) if quote.deal_id else None,
            "title": quote.title,
            "total_amount": quote.total_amount,
            "currency": quote.currency,
            "payment_terms": quote.payment_terms,
            "delivery_terms": quote.delivery_terms,
            "validity_days": quote.validity_days,
            "notes": quote.notes,
        }

        changes = ActivityLogService.compute_changes(old_values, new_values)

        if changes:
            await self.activity_log_service.log_activity(
                deal_id=quote.deal_id,
                action="updated",
                entity_type="quote",
                entity_id=quote.id,
                changes=changes,
                user_id=self.user_id,
                company_id=self.company_id,
            )

        return QuoteResponse.model_validate(quote)

    async def update_quote_status(
        self, quote_id: UUID, new_status: QuoteStatus
    ) -> Optional[QuoteResponse]:
        """
        Update quote status with state machine validation.

        Args:
            quote_id: Quote ID
            new_status: New status

        Returns:
            Updated quote response or None if not found

        Raises:
            ValueError: If transition is not valid
        """
        # Get existing quote
        quote = await self._get_quote_internal(quote_id)
        if not quote:
            return None

        current_status = quote.status

        # Validate transition
        if new_status not in VALID_QUOTE_STATUS_TRANSITIONS.get(current_status, []):
            raise ValueError(
                f"Invalid status transition from {current_status} to {new_status}"
            )

        # Update status
        quote.status = new_status
        await self.db.flush()
        await self.db.refresh(quote)

        # Auto-update deal status when quote is accepted
        if new_status == QuoteStatus.ACCEPTED and quote.deal_id:
            from app.models.deal import Deal, DealStatus
            from app.services.deal import VALID_STATUS_TRANSITIONS

            # Get the deal (filter by company)
            deal_query = select(Deal).where(
                (Deal.id == quote.deal_id)
                & (Deal.deleted_at.is_(None))
                & (Deal.company_id == self.company_id)
            )
            deal_result = await self.db.execute(deal_query)
            deal = deal_result.scalars().first()

            if deal and DealStatus.QUOTED in VALID_STATUS_TRANSITIONS.get(deal.status, []):
                # Auto-update deal status
                old_deal_status = deal.status
                deal.status = DealStatus.QUOTED
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
                            new_value=str(DealStatus.QUOTED),
                        )
                    ],
                    user_id=self.user_id,
                    company_id=self.company_id,
                )

        # Log status change
        await self.activity_log_service.log_activity(
            deal_id=quote.deal_id,
            action="status_changed",
            entity_type="quote",
            entity_id=quote.id,
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

        return QuoteResponse.model_validate(quote)

    async def delete_quote(self, quote_id: UUID) -> bool:
        """
        Soft delete a quote.

        Args:
            quote_id: Quote ID

        Returns:
            True if deleted, False if not found
        """
        quote = await self._get_quote_internal(quote_id)
        if not quote:
            return False

        from datetime import datetime, timezone
        quote.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(quote)

        # Log deletion
        await self.activity_log_service.log_activity(
            deal_id=quote.deal_id,
            action="deleted",
            entity_type="quote",
            entity_id=quote.id,
            user_id=self.user_id,
            company_id=self.company_id,
        )

        return True

    async def _generate_quote_number(self) -> str:
        """
        Generate a unique quote number (QT-2024-001, QT-2024-002, etc.).

        Returns:
            Generated quote number
        """
        from datetime import datetime

        # Get the maximum numeric part of quotes from current year for this company
        current_year = datetime.now().year
        query = select(func.count(Quote.id)).where(
            (Quote.deleted_at.is_(None)) & (Quote.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        count = result.scalar() or 0

        # Generate next number
        next_num = count + 1
        return f"QT-{current_year}-{next_num:03d}"

    async def _get_quote_internal(self, quote_id: UUID) -> Optional[Quote]:
        """Internal method to get quote (excludes soft-deleted, filters by company)."""
        query = select(Quote).where(
            (Quote.id == quote_id)
            & (Quote.deleted_at.is_(None))
            & (Quote.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        return result.scalars().first()

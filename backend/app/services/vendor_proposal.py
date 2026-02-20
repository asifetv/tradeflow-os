"""Service for vendor proposal management - includes proposal comparison (hero feature)."""
from typing import Optional, Union
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.models.vendor_proposal import VendorProposal, VendorProposalStatus
from app.models.vendor import Vendor
from app.models.deal import Deal
from app.schemas.vendor_proposal import (
    VendorProposalCreate,
    VendorProposalUpdate,
    VendorProposalResponse,
    VendorProposalListResponse,
    ProposalComparisonResponse,
    ProposalComparisonItem,
)


class VendorProposalService:
    """Service for vendor proposal management in M3 Procurement."""

    def __init__(
        self,
        db: AsyncSession,
        user_id: Optional[Union[str, UUID]] = None,
        company_id: Optional[UUID] = None,
    ):
        self.db = db
        self.user_id = user_id
        self.company_id = company_id

    async def create_proposal(self, data: VendorProposalCreate) -> VendorProposalResponse:
        """Create a new vendor proposal (request or record received proposal)."""
        # Verify deal belongs to company
        deal_result = await self.db.execute(
            select(Deal).where(
                and_(
                    Deal.id == data.deal_id,
                    Deal.company_id == self.company_id,
                    Deal.deleted_at.is_(None)
                )
            )
        )
        if not deal_result.scalars().first():
            raise ValueError("Deal not found")

        # Verify vendor belongs to company
        vendor_result = await self.db.execute(
            select(Vendor).where(
                and_(
                    Vendor.id == data.vendor_id,
                    Vendor.company_id == self.company_id,
                    Vendor.deleted_at.is_(None)
                )
            )
        )
        if not vendor_result.scalars().first():
            raise ValueError("Vendor not found")

        proposal = VendorProposal(
            company_id=self.company_id,
            deal_id=data.deal_id,
            vendor_id=data.vendor_id,
            status=VendorProposalStatus.REQUESTED,
            total_price=data.total_price,
            currency=data.currency,
            lead_time_days=data.lead_time_days,
            payment_terms=data.payment_terms,
            validity_date=data.validity_date,
            specs_match=data.specs_match,
            discrepancies=data.discrepancies,
            notes=data.notes,
            raw_document_url=data.raw_document_url,
            parsed_data=data.parsed_data,
        )
        self.db.add(proposal)
        await self.db.flush()
        return VendorProposalResponse.from_orm(proposal)

    async def get_proposal(self, proposal_id: UUID) -> Optional[VendorProposalResponse]:
        """Get proposal by ID."""
        result = await self.db.execute(
            select(VendorProposal)
            .where(
                and_(
                    VendorProposal.id == proposal_id,
                    VendorProposal.company_id == self.company_id,
                    VendorProposal.deleted_at.is_(None)
                )
            )
            .options(selectinload(VendorProposal.vendor))
        )
        proposal = result.unique().scalars().first()
        return VendorProposalResponse.from_orm(proposal) if proposal else None

    async def update_proposal(self, proposal_id: UUID, data: VendorProposalUpdate) -> VendorProposalResponse:
        """Update vendor proposal."""
        result = await self.db.execute(
            select(VendorProposal).where(
                and_(
                    VendorProposal.id == proposal_id,
                    VendorProposal.company_id == self.company_id,
                    VendorProposal.deleted_at.is_(None)
                )
            )
        )
        proposal = result.scalars().first()
        if not proposal:
            raise ValueError("Proposal not found")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(proposal, key, value)

        await self.db.flush()
        return VendorProposalResponse.from_orm(proposal)

    async def delete_proposal(self, proposal_id: UUID) -> None:
        """Soft delete proposal."""
        result = await self.db.execute(
            select(VendorProposal).where(
                and_(
                    VendorProposal.id == proposal_id,
                    VendorProposal.company_id == self.company_id,
                    VendorProposal.deleted_at.is_(None)
                )
            )
        )
        proposal = result.scalars().first()
        if not proposal:
            raise ValueError("Proposal not found")

        proposal.deleted_at = func.now()
        await self.db.flush()

    async def list_proposals(
        self,
        skip: int = 0,
        limit: int = 100,
        deal_id: Optional[UUID] = None,
        vendor_id: Optional[UUID] = None,
    ) -> VendorProposalListResponse:
        """List proposals for company with optional deal and vendor filters."""
        # Build where conditions
        conditions = [
            VendorProposal.company_id == self.company_id,
            VendorProposal.deleted_at.is_(None),
        ]

        if deal_id:
            conditions.append(VendorProposal.deal_id == deal_id)
        if vendor_id:
            conditions.append(VendorProposal.vendor_id == vendor_id)

        # Count total
        count_result = await self.db.execute(
            select(func.count(VendorProposal.id)).where(and_(*conditions))
        )
        total = count_result.scalar() or 0

        # Fetch proposals
        result = await self.db.execute(
            select(VendorProposal)
            .where(and_(*conditions))
            .options(selectinload(VendorProposal.vendor))
            .order_by(VendorProposal.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        proposals = result.unique().scalars().all()

        return VendorProposalListResponse(
            total=total,
            items=[VendorProposalResponse.from_orm(p) for p in proposals]
        )

    async def list_proposals_for_deal(self, deal_id: UUID) -> list:
        """Get all proposals for a specific deal (used for comparison)."""
        result = await self.db.execute(
            select(VendorProposal)
            .where(
                and_(
                    VendorProposal.deal_id == deal_id,
                    VendorProposal.company_id == self.company_id,
                    VendorProposal.deleted_at.is_(None)
                )
            )
            .options(selectinload(VendorProposal.vendor))
            .order_by(VendorProposal.created_at.asc())
        )
        return result.unique().scalars().all()

    async def get_proposal_comparison(self, deal_id: UUID) -> ProposalComparisonResponse:
        """
        HERO FEATURE: Compare all vendor proposals for a deal side-by-side.
        Returns structured data for the proposal comparison dashboard.

        Displays:
        - All vendors with their proposals
        - Vendor credibility scores
        - Pricing comparison (highlights best/worst)
        - Lead time comparison
        - Spec match status and discrepancies
        """
        # Verify deal belongs to company
        deal_result = await self.db.execute(
            select(Deal).where(
                and_(
                    Deal.id == deal_id,
                    Deal.company_id == self.company_id,
                    Deal.deleted_at.is_(None)
                )
            )
        )
        if not deal_result.scalars().first():
            raise ValueError("Deal not found")

        # Get all proposals for this deal
        proposals = await self.list_proposals_for_deal(deal_id)

        # Calculate statistics for highlighting
        prices = [p.total_price for p in proposals if p.total_price]
        lead_times = [p.lead_time_days for p in proposals if p.lead_time_days]

        best_price = min(prices) if prices else None
        worst_price = max(prices) if prices else None
        best_lead_time = min(lead_times) if lead_times else None
        worst_lead_time = max(lead_times) if lead_times else None

        # Build comparison items
        comparison_items = []
        for proposal in proposals:
            item = ProposalComparisonItem(
                id=proposal.id,
                vendor_id=proposal.vendor_id,
                vendor_name=proposal.vendor.company_name,
                vendor_credibility=proposal.vendor.credibility_score,
                total_price=proposal.total_price,
                lead_time_days=proposal.lead_time_days,
                specs_match=proposal.specs_match,
                discrepancies=proposal.discrepancies,
                status=proposal.status.value,
                is_best_price=(
                    proposal.total_price == best_price
                    if proposal.total_price and best_price
                    else False
                ),
                is_worst_price=(
                    proposal.total_price == worst_price
                    if proposal.total_price and worst_price
                    else False
                ),
                is_best_lead_time=(
                    proposal.lead_time_days == best_lead_time
                    if proposal.lead_time_days and best_lead_time
                    else False
                ),
            )
            comparison_items.append(item)

        return ProposalComparisonResponse(
            deal_id=deal_id,
            proposals=comparison_items,
            best_price=best_price,
            worst_price=worst_price,
            best_lead_time=best_lead_time,
            worst_lead_time=worst_lead_time,
        )

    async def select_vendor(self, proposal_id: UUID) -> VendorProposalResponse:
        """
        Select a vendor for a deal.
        This marks the proposal as selected and rejects all other proposals for the same deal.
        """
        # Get the proposal
        result = await self.db.execute(
            select(VendorProposal).where(
                and_(
                    VendorProposal.id == proposal_id,
                    VendorProposal.company_id == self.company_id,
                    VendorProposal.deleted_at.is_(None)
                )
            )
        )
        proposal = result.scalars().first()
        if not proposal:
            raise ValueError("Proposal not found")

        # Reject all other proposals for this deal
        await self.db.execute(
            select(VendorProposal)
            .where(
                and_(
                    VendorProposal.deal_id == proposal.deal_id,
                    VendorProposal.id != proposal_id,
                    VendorProposal.company_id == self.company_id,
                    VendorProposal.deleted_at.is_(None)
                )
            )
        )
        other_proposals = await self.db.execute(
            select(VendorProposal).where(
                and_(
                    VendorProposal.deal_id == proposal.deal_id,
                    VendorProposal.id != proposal_id,
                    VendorProposal.company_id == self.company_id,
                    VendorProposal.deleted_at.is_(None)
                )
            )
        )
        for other in other_proposals.scalars().all():
            other.status = VendorProposalStatus.REJECTED

        # Mark selected proposal as selected
        proposal.status = VendorProposalStatus.SELECTED
        await self.db.flush()

        return VendorProposalResponse.from_orm(proposal)

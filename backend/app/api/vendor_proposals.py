"""API routes for vendor proposals (M3 Procurement) - includes hero feature."""
from fastapi import APIRouter, HTTPException, Query
from uuid import UUID

from app.deps import SessionDep, CurrentUserDep
from app.schemas.vendor_proposal import (
    VendorProposalCreate,
    VendorProposalUpdate,
    VendorProposalResponse,
    VendorProposalListResponse,
    ProposalComparisonResponse,
)
from app.services.vendor_proposal import VendorProposalService

router = APIRouter(prefix="/api/vendor-proposals", tags=["vendor-proposals"])


@router.post("", response_model=VendorProposalResponse)
async def create_proposal(
    data: VendorProposalCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Create or record a vendor proposal."""
    try:
        service = VendorProposalService(
            db,
            user_id=current_user["user_id"],
            company_id=current_user["company_id"],
        )
        proposal = await service.create_proposal(data)
        await db.commit()
        return proposal
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{proposal_id}", response_model=VendorProposalResponse)
async def get_proposal(
    proposal_id: UUID,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Get proposal by ID."""
    service = VendorProposalService(
        db,
        user_id=current_user["user_id"],
        company_id=current_user["company_id"],
    )
    proposal = await service.get_proposal(proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal


@router.put("/{proposal_id}", response_model=VendorProposalResponse)
async def update_proposal(
    proposal_id: UUID,
    data: VendorProposalUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Update vendor proposal."""
    try:
        service = VendorProposalService(
            db,
            user_id=current_user["user_id"],
            company_id=current_user["company_id"],
        )
        proposal = await service.update_proposal(proposal_id, data)
        await db.commit()
        return proposal
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{proposal_id}")
async def delete_proposal(
    proposal_id: UUID,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Delete proposal (soft delete)."""
    try:
        service = VendorProposalService(
            db,
            user_id=current_user["user_id"],
            company_id=current_user["company_id"],
        )
        await service.delete_proposal(proposal_id)
        await db.commit()
        return {"message": "Proposal deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=VendorProposalListResponse)
async def list_proposals(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: SessionDep = None,
    current_user: CurrentUserDep = None,
):
    """List all proposals for company."""
    service = VendorProposalService(
        db,
        user_id=current_user["user_id"],
        company_id=current_user["company_id"],
    )
    result = await service.list_proposals(skip=skip, limit=limit)
    return result


@router.get("/compare/{deal_id}", response_model=ProposalComparisonResponse)
async def compare_proposals(
    deal_id: UUID,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """
    HERO FEATURE: Compare all vendor proposals for a deal side-by-side.

    Returns structured data for the proposal comparison dashboard:
    - All vendors with their credibility scores
    - Pricing comparison (highlights best/worst)
    - Lead time comparison
    - Spec match status and discrepancies
    - Proposal status for each vendor

    This is the key differentiator that sells TradeFlow OS to customers:
    see all vendor options at a glance and make data-driven procurement decisions.
    """
    try:
        service = VendorProposalService(
            db,
            user_id=current_user["user_id"],
            company_id=current_user["company_id"],
        )
        comparison = await service.get_proposal_comparison(deal_id)
        return comparison
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{proposal_id}/select")
async def select_vendor(
    proposal_id: UUID,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """
    Select a vendor for a deal.
    This marks the selected proposal as 'selected' and rejects all other proposals.
    """
    try:
        service = VendorProposalService(
            db,
            user_id=current_user["user_id"],
            company_id=current_user["company_id"],
        )
        proposal = await service.select_vendor(proposal_id)
        await db.commit()
        return {"message": "Vendor selected", "proposal": proposal}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

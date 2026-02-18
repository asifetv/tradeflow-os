"""API endpoints for quote management."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.deps import CurrentUserDep, SessionDep
from app.models.quote import QuoteStatus
from app.schemas.quote import (
    QuoteCreate,
    QuotesListResponse,
    QuoteResponse,
    QuoteStatusUpdate,
    QuoteUpdate,
)
from app.services.quote import QuoteService

router = APIRouter(
    prefix="/api/quotes",
    tags=["quotes"],
)


@router.post("", response_model=QuoteResponse, status_code=status.HTTP_201_CREATED)
async def create_quote(
    quote_data: QuoteCreate,
    db: SessionDep,
    user_id: CurrentUserDep,
):
    """Create a new quote."""
    service = QuoteService(db, user_id=user_id)
    quote = await service.create_quote(quote_data)
    await db.commit()
    return quote


@router.get("", response_model=QuotesListResponse)
async def list_quotes(
    db: SessionDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    customer_id: Optional[UUID] = Query(None),
    deal_id: Optional[UUID] = Query(None),
    status: Optional[QuoteStatus] = Query(None),
):
    """List quotes with optional filters."""
    service = QuoteService(db)
    return await service.list_quotes(
        skip=skip,
        limit=limit,
        customer_id=customer_id,
        deal_id=deal_id,
        status=status,
    )


@router.get("/{quote_id}", response_model=QuoteResponse)
async def get_quote(
    quote_id: UUID,
    db: SessionDep,
):
    """Get quote detail."""
    service = QuoteService(db)
    quote = await service.get_quote(quote_id)

    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quote {quote_id} not found",
        )

    return quote


@router.patch("/{quote_id}", response_model=QuoteResponse)
async def update_quote(
    quote_id: UUID,
    update_data: QuoteUpdate,
    db: SessionDep,
    user_id: CurrentUserDep,
):
    """Update a quote."""
    service = QuoteService(db, user_id=user_id)
    quote = await service.update_quote(quote_id, update_data)

    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quote {quote_id} not found",
        )

    await db.commit()
    return quote


@router.patch("/{quote_id}/status", response_model=QuoteResponse)
async def update_quote_status(
    quote_id: UUID,
    status_data: QuoteStatusUpdate,
    db: SessionDep,
    user_id: CurrentUserDep,
):
    """Update quote status with state machine validation."""
    service = QuoteService(db, user_id=user_id)

    try:
        quote = await service.update_quote_status(quote_id, status_data.status)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quote {quote_id} not found",
        )

    await db.commit()
    return quote


@router.delete("/{quote_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quote(
    quote_id: UUID,
    db: SessionDep,
    user_id: CurrentUserDep,
):
    """Soft delete a quote."""
    service = QuoteService(db, user_id=user_id)
    deleted = await service.delete_quote(quote_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quote {quote_id} not found",
        )

    await db.commit()

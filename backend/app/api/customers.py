"""API endpoints for customer management."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.deps import CurrentUserDep, SessionDep
from app.schemas.customer import (
    CustomerCreate,
    CustomersListResponse,
    CustomerResponse,
    CustomerUpdate,
)
from app.schemas.deal import DealListResponse
from app.schemas.quote import QuotesListResponse
from app.schemas.customer_po import CustomerPOsListResponse
from app.services.customer import CustomerService
from app.services.deal import DealService
from app.services.quote import QuoteService
from app.services.customer_po import CustomerPOService

router = APIRouter(
    prefix="/api/customers",
    tags=["customers"],
)


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_data: CustomerCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Create a new customer."""
    service = CustomerService(
        db,
        user_id=current_user["user_id"],
        company_id=current_user["company_id"]
    )
    customer = await service.create_customer(customer_data)
    await db.commit()
    return customer


@router.get("", response_model=CustomersListResponse)
async def list_customers(
    db: SessionDep,
    current_user: CurrentUserDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_active: Optional[bool] = Query(None),
    country: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    """List customers with optional filters."""
    service = CustomerService(
        db,
        user_id=current_user["user_id"],
        company_id=current_user["company_id"]
    )
    return await service.list_customers(
        skip=skip,
        limit=limit,
        is_active=is_active,
        country=country,
        search=search,
    )


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: UUID,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Get customer detail."""
    service = CustomerService(
        db,
        user_id=current_user["user_id"],
        company_id=current_user["company_id"]
    )
    customer = await service.get_customer(customer_id)

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer {customer_id} not found",
        )

    return customer


@router.patch("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: UUID,
    update_data: CustomerUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Update a customer."""
    service = CustomerService(
        db,
        user_id=current_user["user_id"],
        company_id=current_user["company_id"]
    )
    customer = await service.update_customer(customer_id, update_data)

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer {customer_id} not found",
        )

    await db.commit()
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: UUID,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Soft delete a customer."""
    service = CustomerService(
        db,
        user_id=current_user["user_id"],
        company_id=current_user["company_id"]
    )
    deleted = await service.delete_customer(customer_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer {customer_id} not found",
        )

    await db.commit()


@router.get("/{customer_id}/deals", response_model=DealListResponse)
async def get_customer_deals(
    customer_id: UUID,
    db: SessionDep,
    current_user: CurrentUserDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get all deals linked to a customer."""
    service = DealService(
        db,
        user_id=current_user["user_id"],
        company_id=current_user["company_id"]
    )
    return await service.list_deals(
        skip=skip,
        limit=limit,
        customer_id=customer_id,
    )


@router.get("/{customer_id}/quotes", response_model=QuotesListResponse)
async def get_customer_quotes(
    customer_id: UUID,
    db: SessionDep,
    current_user: CurrentUserDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get all quotes linked to a customer."""
    service = QuoteService(
        db,
        user_id=current_user["user_id"],
        company_id=current_user["company_id"]
    )
    return await service.list_quotes(
        skip=skip,
        limit=limit,
        customer_id=customer_id,
    )


@router.get("/{customer_id}/pos", response_model=CustomerPOsListResponse)
async def get_customer_pos(
    customer_id: UUID,
    db: SessionDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """Get all customer POs linked to a customer."""
    service = CustomerPOService(db)
    return await service.list_customer_pos(
        skip=skip,
        limit=limit,
        customer_id=customer_id,
    )

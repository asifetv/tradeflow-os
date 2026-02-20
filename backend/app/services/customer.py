"""Customer service for CRM operations."""
from typing import Optional, Union
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.schemas.customer import (
    CustomerCreate,
    CustomersListResponse,
    CustomerResponse,
    CustomerUpdate,
)
from app.services.activity_log import ActivityLogService


class CustomerService:
    """Service for customer CRUD operations."""

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

    async def create_customer(self, customer_data: CustomerCreate) -> CustomerResponse:
        """
        Create a new customer.

        Args:
            customer_data: Customer creation data

        Returns:
            Created customer response
        """
        # Auto-generate customer code if not provided
        customer_code = customer_data.customer_code
        if not customer_code:
            customer_code = await self._generate_customer_code()

        customer = Customer(
            company_id=self.company_id,
            customer_code=customer_code,
            company_name=customer_data.company_name,
            country=customer_data.country,
            city=customer_data.city,
            address=customer_data.address,
            primary_contact_name=customer_data.primary_contact_name,
            primary_contact_email=customer_data.primary_contact_email,
            primary_contact_phone=customer_data.primary_contact_phone,
            payment_terms=customer_data.payment_terms,
            credit_limit=customer_data.credit_limit,
            is_active=customer_data.is_active,
            notes=customer_data.notes,
        )

        self.db.add(customer)
        await self.db.flush()
        await self.db.refresh(customer)

        # Log creation
        await self.activity_log_service.log_activity(
            deal_id=None,
            action="created",
            entity_type="customer",
            entity_id=customer.id,
            user_id=self.user_id,
            company_id=self.company_id,
        )

        return CustomerResponse.model_validate(customer)

    async def _generate_customer_code(self) -> str:
        """
        Generate a unique customer code (CUST-001, CUST-002, etc.).

        Returns:
            Generated customer code
        """
        # Get the maximum numeric part of existing customer codes for this company
        query = select(func.count(Customer.id)).where(
            (Customer.deleted_at.is_(None)) & (Customer.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        count = result.scalar() or 0

        # Generate next code
        next_num = count + 1
        return f"CUST-{next_num:03d}"

    async def get_customer(self, customer_id: UUID) -> Optional[CustomerResponse]:
        """
        Get a customer by ID (excludes soft-deleted).

        Args:
            customer_id: Customer ID

        Returns:
            Customer response or None if not found
        """
        query = select(Customer).where(
            (Customer.id == customer_id)
            & (Customer.deleted_at.is_(None))
            & (Customer.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        customer = result.scalars().first()

        return CustomerResponse.model_validate(customer) if customer else None

    async def list_customers(
        self,
        skip: int = 0,
        limit: int = 50,
        is_active: Optional[bool] = None,
        country: Optional[str] = None,
        search: Optional[str] = None,
    ) -> CustomersListResponse:
        """
        List customers with optional filters.

        Args:
            skip: Number of records to skip
            limit: Max records to return
            is_active: Filter by active status
            country: Filter by country
            search: Search by company name or customer code

        Returns:
            Paginated list response
        """
        # Build base query (exclude soft-deleted, filter by company)
        query = select(Customer).where(
            (Customer.deleted_at.is_(None)) & (Customer.company_id == self.company_id)
        )

        # Apply filters
        if is_active is not None:
            query = query.where(Customer.is_active == is_active)
        if country:
            query = query.where(Customer.country == country)
        if search:
            search_term = f"%{search}%"
            query = query.where(
                (Customer.company_name.ilike(search_term))
                | (Customer.customer_code.ilike(search_term))
            )

        # Get total count
        count_query = select(func.count()).select_from(Customer).where(
            (Customer.deleted_at.is_(None)) & (Customer.company_id == self.company_id)
        )
        if is_active is not None:
            count_query = count_query.where(Customer.is_active == is_active)
        if country:
            count_query = count_query.where(Customer.country == country)
        if search:
            search_term = f"%{search}%"
            count_query = count_query.where(
                (Customer.company_name.ilike(search_term))
                | (Customer.customer_code.ilike(search_term))
            )

        count_result = await self.db.execute(count_query)
        total = count_result.scalar() or 0

        # Get paginated results, ordered by created_at DESC
        query = (
            query.order_by(Customer.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        customers = result.scalars().all()

        return CustomersListResponse(
            customers=[CustomerResponse.model_validate(customer) for customer in customers],
            total=total,
            skip=skip,
            limit=limit,
        )

    async def update_customer(
        self, customer_id: UUID, update_data: CustomerUpdate
    ) -> Optional[CustomerResponse]:
        """
        Update a customer and log changes.

        Args:
            customer_id: Customer ID
            update_data: Partial update data

        Returns:
            Updated customer response or None if not found
        """
        # Get existing customer
        customer = await self._get_customer_internal(customer_id)
        if not customer:
            return None

        # Capture old values
        old_values = {
            "customer_code": customer.customer_code,
            "company_name": customer.company_name,
            "country": customer.country,
            "city": customer.city,
            "address": customer.address,
            "primary_contact_name": customer.primary_contact_name,
            "primary_contact_email": customer.primary_contact_email,
            "primary_contact_phone": customer.primary_contact_phone,
            "payment_terms": customer.payment_terms,
            "credit_limit": customer.credit_limit,
            "is_active": customer.is_active,
            "notes": customer.notes,
        }

        # Update fields
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(customer, field, value)

        await self.db.flush()
        await self.db.refresh(customer)

        # Compute changes
        new_values = {
            "customer_code": customer.customer_code,
            "company_name": customer.company_name,
            "country": customer.country,
            "city": customer.city,
            "address": customer.address,
            "primary_contact_name": customer.primary_contact_name,
            "primary_contact_email": customer.primary_contact_email,
            "primary_contact_phone": customer.primary_contact_phone,
            "payment_terms": customer.payment_terms,
            "credit_limit": customer.credit_limit,
            "is_active": customer.is_active,
            "notes": customer.notes,
        }

        changes = ActivityLogService.compute_changes(old_values, new_values)

        if changes:
            await self.activity_log_service.log_activity(
                deal_id=None,
                action="updated",
                entity_type="customer",
                entity_id=customer.id,
                changes=changes,
                user_id=self.user_id,
                company_id=self.company_id,
            )

        return CustomerResponse.model_validate(customer)

    async def delete_customer(self, customer_id: UUID) -> bool:
        """
        Soft delete a customer.

        Args:
            customer_id: Customer ID

        Returns:
            True if deleted, False if not found
        """
        customer = await self._get_customer_internal(customer_id)
        if not customer:
            return False

        from datetime import datetime, timezone
        customer.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()
        await self.db.refresh(customer)

        # Log deletion
        await self.activity_log_service.log_activity(
            deal_id=None,
            action="deleted",
            entity_type="customer",
            entity_id=customer.id,
            user_id=self.user_id,
            company_id=self.company_id,
        )

        return True

    async def _get_customer_internal(self, customer_id: UUID) -> Optional[Customer]:
        """Internal method to get customer (excludes soft-deleted, filters by company)."""
        query = select(Customer).where(
            (Customer.id == customer_id)
            & (Customer.deleted_at.is_(None))
            & (Customer.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        return result.scalars().first()

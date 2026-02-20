"""Service for vendor management."""
from typing import Optional, Union
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.models.vendor import Vendor
from app.models.vendor_proposal import VendorProposal
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorResponse, VendorListResponse


class VendorService:
    """Service for vendor management in M3 Procurement."""

    def __init__(
        self,
        db: AsyncSession,
        user_id: Optional[Union[str, UUID]] = None,
        company_id: Optional[UUID] = None,
    ):
        self.db = db
        self.user_id = user_id
        self.company_id = company_id

    async def _generate_vendor_code(self) -> str:
        """
        Generate a unique vendor code (VEND-001, VEND-002, etc.).

        Returns:
            Generated vendor code
        """
        # Get the maximum numeric part of existing vendor codes for this company
        query = select(func.count(Vendor.id)).where(
            (Vendor.deleted_at.is_(None)) & (Vendor.company_id == self.company_id)
        )
        result = await self.db.execute(query)
        count = result.scalar() or 0

        # Generate next code
        next_num = count + 1
        return f"VEND-{next_num:03d}"

    async def create_vendor(self, data: VendorCreate) -> VendorResponse:
        """Create a new vendor."""
        # Auto-generate vendor_code if not provided
        vendor_code = data.vendor_code
        if not vendor_code:
            vendor_code = await self._generate_vendor_code()

        # Check if vendor_code already exists in this company
        existing = await self.db.execute(
            select(Vendor).where(
                and_(
                    Vendor.vendor_code == vendor_code,
                    Vendor.company_id == self.company_id,
                    Vendor.deleted_at.is_(None)
                )
            )
        )
        if existing.scalars().first():
            raise ValueError(f"Vendor code '{vendor_code}' already exists in this company")

        vendor = Vendor(
            company_id=self.company_id,
            vendor_code=vendor_code,
            company_name=data.company_name,
            country=data.country,
            certifications=data.certifications,
            product_categories=data.product_categories,
            credibility_score=data.credibility_score or 50,
            on_time_delivery_rate=data.on_time_delivery_rate,
            quality_score=data.quality_score,
            avg_lead_time_days=data.avg_lead_time_days,
            primary_contact_name=data.primary_contact_name,
            primary_contact_email=data.primary_contact_email,
            primary_contact_phone=data.primary_contact_phone,
            payment_terms=data.payment_terms,
            notes=data.notes,
            is_active=True,
        )
        self.db.add(vendor)
        await self.db.flush()
        return VendorResponse.from_orm(vendor)

    async def get_vendor(self, vendor_id: UUID) -> Optional[VendorResponse]:
        """Get vendor by ID."""
        result = await self.db.execute(
            select(Vendor).where(
                and_(
                    Vendor.id == vendor_id,
                    Vendor.company_id == self.company_id,
                    Vendor.deleted_at.is_(None)
                )
            )
        )
        vendor = result.scalars().first()
        return VendorResponse.from_orm(vendor) if vendor else None

    async def update_vendor(self, vendor_id: UUID, data: VendorUpdate) -> VendorResponse:
        """Update vendor."""
        result = await self.db.execute(
            select(Vendor).where(
                and_(
                    Vendor.id == vendor_id,
                    Vendor.company_id == self.company_id,
                    Vendor.deleted_at.is_(None)
                )
            )
        )
        vendor = result.scalars().first()
        if not vendor:
            raise ValueError("Vendor not found")

        # Check if vendor_code is being changed and if new code already exists
        if data.vendor_code and data.vendor_code != vendor.vendor_code:
            existing = await self.db.execute(
                select(Vendor).where(
                    and_(
                        Vendor.vendor_code == data.vendor_code,
                        Vendor.company_id == self.company_id,
                        Vendor.deleted_at.is_(None)
                    )
                )
            )
            if existing.scalars().first():
                raise ValueError(f"Vendor code '{data.vendor_code}' already exists in this company")

        # Update fields
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(vendor, key, value)

        await self.db.flush()
        return VendorResponse.from_orm(vendor)

    async def delete_vendor(self, vendor_id: UUID) -> None:
        """Soft delete vendor."""
        result = await self.db.execute(
            select(Vendor).where(
                and_(
                    Vendor.id == vendor_id,
                    Vendor.company_id == self.company_id,
                    Vendor.deleted_at.is_(None)
                )
            )
        )
        vendor = result.scalars().first()
        if not vendor:
            raise ValueError("Vendor not found")

        vendor.deleted_at = func.now()
        await self.db.flush()

    async def list_vendors(self, skip: int = 0, limit: int = 100) -> VendorListResponse:
        """List all active vendors for company."""
        # Get total count
        count_result = await self.db.execute(
            select(func.count(Vendor.id)).where(
                and_(
                    Vendor.company_id == self.company_id,
                    Vendor.deleted_at.is_(None)
                )
            )
        )
        total = count_result.scalar() or 0

        # Get paginated items
        result = await self.db.execute(
            select(Vendor)
            .where(
                and_(
                    Vendor.company_id == self.company_id,
                    Vendor.deleted_at.is_(None)
                )
            )
            .order_by(Vendor.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        vendors = result.scalars().all()

        return VendorListResponse(
            total=total,
            items=[VendorResponse.from_orm(v) for v in vendors]
        )

    async def search_vendors(self, query: str, skip: int = 0, limit: int = 100) -> VendorListResponse:
        """Search vendors by name or code."""
        count_result = await self.db.execute(
            select(func.count(Vendor.id)).where(
                and_(
                    Vendor.company_id == self.company_id,
                    Vendor.deleted_at.is_(None),
                    (
                        (Vendor.company_name.ilike(f"%{query}%")) |
                        (Vendor.vendor_code.ilike(f"%{query}%"))
                    )
                )
            )
        )
        total = count_result.scalar() or 0

        result = await self.db.execute(
            select(Vendor)
            .where(
                and_(
                    Vendor.company_id == self.company_id,
                    Vendor.deleted_at.is_(None),
                    (
                        (Vendor.company_name.ilike(f"%{query}%")) |
                        (Vendor.vendor_code.ilike(f"%{query}%"))
                    )
                )
            )
            .order_by(Vendor.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        vendors = result.scalars().all()

        return VendorListResponse(
            total=total,
            items=[VendorResponse.from_orm(v) for v in vendors]
        )

    async def get_vendor_proposals(self, vendor_id: UUID) -> list:
        """Get all proposals from a vendor."""
        result = await self.db.execute(
            select(VendorProposal)
            .where(
                and_(
                    VendorProposal.vendor_id == vendor_id,
                    VendorProposal.company_id == self.company_id,
                    VendorProposal.deleted_at.is_(None)
                )
            )
            .order_by(VendorProposal.created_at.desc())
        )
        return result.scalars().all()

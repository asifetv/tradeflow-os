"""API routes for vendor management (M3 Procurement)."""
from fastapi import APIRouter, HTTPException, Query
from uuid import UUID

from app.deps import SessionDep, CurrentUserDep
from app.schemas.vendor import VendorCreate, VendorUpdate, VendorResponse, VendorListResponse
from app.services.vendor import VendorService

router = APIRouter(prefix="/api/vendors", tags=["vendors"])


@router.post("", response_model=VendorResponse)
async def create_vendor(
    data: VendorCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Create a new vendor."""
    try:
        service = VendorService(
            db,
            user_id=current_user["user_id"],
            company_id=current_user["company_id"],
        )
        vendor = await service.create_vendor(data)
        await db.commit()
        return vendor
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor(
    vendor_id: UUID,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Get vendor by ID."""
    service = VendorService(
        db,
        user_id=current_user["user_id"],
        company_id=current_user["company_id"],
    )
    vendor = await service.get_vendor(vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.put("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: UUID,
    data: VendorUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Update vendor."""
    try:
        service = VendorService(
            db,
            user_id=current_user["user_id"],
            company_id=current_user["company_id"],
        )
        vendor = await service.update_vendor(vendor_id, data)
        await db.commit()
        return vendor
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{vendor_id}")
async def delete_vendor(
    vendor_id: UUID,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Delete vendor (soft delete)."""
    try:
        service = VendorService(
            db,
            user_id=current_user["user_id"],
            company_id=current_user["company_id"],
        )
        await service.delete_vendor(vendor_id)
        await db.commit()
        return {"message": "Vendor deleted"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=VendorListResponse)
async def list_vendors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: SessionDep = None,
    current_user: CurrentUserDep = None,
):
    """List all vendors for company."""
    service = VendorService(
        db,
        user_id=current_user["user_id"],
        company_id=current_user["company_id"],
    )
    result = await service.list_vendors(skip=skip, limit=limit)
    return result


@router.get("/search", response_model=VendorListResponse)
async def search_vendors(
    q: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: SessionDep = None,
    current_user: CurrentUserDep = None,
):
    """Search vendors by name or code."""
    service = VendorService(
        db,
        user_id=current_user["user_id"],
        company_id=current_user["company_id"],
    )
    result = await service.search_vendors(q, skip=skip, limit=limit)
    return result

"""API endpoints for document management."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status, File, UploadFile, Form
from fastapi.responses import JSONResponse

from app.deps import CurrentUserDep, SessionDep
from app.models.document import DocumentCategory
from app.schemas.document import (
    DocumentListResponse,
    DocumentResponse,
    DocumentDownloadUrlResponse,
    DocumentResponseWithoutText,
)
from app.services.document import DocumentService

router = APIRouter(
    prefix="/api/documents",
    tags=["documents"],
)

# Maximum file size: 25MB
MAX_FILE_SIZE = 25 * 1024 * 1024
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/tiff",
    "image/webp",
}


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    category: DocumentCategory = Form(...),
    entity_type: Optional[str] = Form(None),
    entity_id: Optional[UUID] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    db: SessionDep = None,
    current_user: CurrentUserDep = None,
):
    """
    Upload and process a document.

    - Validates file size and type
    - Uploads to MinIO
    - Extracts text (PDF, Excel, Word, Image with OCR)
    - Sends to Claude for structured extraction
    - Returns document with parsed_data

    Returns document with status:
    - PROCESSING: Currently being processed
    - COMPLETED: Successfully processed with parsed_data
    - FAILED: Processing failed, check error_message
    """
    if not db or not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        # Validate file size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large (max {MAX_FILE_SIZE / 1024 / 1024:.0f}MB)",
            )

        # Validate MIME type
        mime_type = file.content_type or "application/octet-stream"
        if mime_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type. Allowed: PDF, Excel, Word, Images",
            )

        # Parse tags
        tag_list = []
        if tags:
            tag_list = [t.strip() for t in tags.split(",") if t.strip()]

        # Process document
        service = DocumentService(
            db=db,
            company_id=current_user["company_id"],
            user_id=current_user["user_id"],
        )

        document = await service.upload_and_process_document(
            file_content=content,
            filename=file.filename or "document",
            mime_type=mime_type,
            category=category,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            tags=tag_list,
        )

        # Detach object from session to avoid lazy-loading errors
        db.expunge(document)

        # Now it's safe to access attributes and convert to response
        return DocumentResponse.model_validate(document)

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        import traceback
        error_msg = f"{type(e).__name__}: {str(e)}"
        traceback.print_exc()  # Print to console
        print(f"❌ DOCUMENT UPLOAD ERROR: {error_msg}", flush=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=error_msg)


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    db: SessionDep,
    current_user: CurrentUserDep,
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[UUID] = Query(None),
    category: Optional[DocumentCategory] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """
    List documents attached to entities.

    Optional filters:
    - entity_type: Document type (Deal, Quote, Vendor, etc.)
    - entity_id: Parent entity ID
    - category: Document category
    """
    service = DocumentService(
        db=db,
        company_id=current_user["company_id"],
        user_id=current_user["user_id"],
    )

    documents, total = await service.list_documents(
        entity_type=entity_type,
        entity_id=entity_id,
        category=category,
        skip=skip,
        limit=limit,
    )

    return DocumentListResponse(
        items=[DocumentResponseWithoutText.model_validate(doc) for doc in documents],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/company-docs", response_model=DocumentListResponse)
async def list_company_documents(
    db: SessionDep,
    current_user: CurrentUserDep,
    category: Optional[DocumentCategory] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """
    List company-level documents (not attached to any entity).

    Optional filters:
    - category: Document category (COMPANY_POLICY, TEMPLATE, etc.)
    """
    service = DocumentService(
        db=db,
        company_id=current_user["company_id"],
        user_id=current_user["user_id"],
    )

    documents, total = await service.list_company_documents(
        category=category,
        skip=skip,
        limit=limit,
    )

    return DocumentListResponse(
        items=[DocumentResponseWithoutText.model_validate(doc) for doc in documents],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """Get full document detail including extracted_text."""
    service = DocumentService(
        db=db,
        company_id=current_user["company_id"],
        user_id=current_user["user_id"],
    )

    document = await service.get_document(document_id)

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    # Detach object from session to avoid lazy-loading errors
    db.expunge(document)

    # Now it's safe to access attributes and convert to response
    return DocumentResponse.model_validate(document)


@router.get("/{document_id}/download", response_model=DocumentDownloadUrlResponse)
async def get_download_url(
    document_id: UUID,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """
    Get presigned download URL for document.

    URL is valid for 60 minutes.
    """
    service = DocumentService(
        db=db,
        company_id=current_user["company_id"],
        user_id=current_user["user_id"],
    )

    try:
        url = await service.get_download_url(document_id)
        document = await service.get_document(document_id)

        return DocumentDownloadUrlResponse(
            url=url,
            expires_in_minutes=60,
            filename=document.original_filename if document else "document",
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    """
    Soft delete document.

    Document is marked deleted but remains in database for audit.
    """
    service = DocumentService(
        db=db,
        company_id=current_user["company_id"],
        user_id=current_user["user_id"],
    )

    try:
        await service.delete_document(document_id)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )

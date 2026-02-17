"""Activity log request/response schemas."""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ChangeDetail(BaseModel):
    """Details of a single field change."""
    field: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None


class ActivityLogResponse(BaseModel):
    """Activity log response schema."""
    id: UUID
    deal_id: UUID
    user_id: Optional[UUID] = None
    action: str
    entity_type: str
    entity_id: UUID
    changes: List[ChangeDetail] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DealActivityListResponse(BaseModel):
    """List of activity logs for a deal."""
    activity_logs: List[ActivityLogResponse]
    total: int

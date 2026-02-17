"""Activity log model for audit trail."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ActivityLog(Base):
    """Audit trail for all deal mutations."""

    __tablename__ = "activity_log"

    # IDs
    id: Mapped[UUID] = mapped_column(primary_key=True, default=lambda: __import__('uuid').uuid4())
    deal_id: Mapped[UUID] = mapped_column(nullable=False, index=True)
    user_id: Mapped[Optional[UUID]] = mapped_column(nullable=True)

    # Action
    action: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="created, updated, status_changed, deleted"
    )

    # Entity being changed
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[UUID] = mapped_column(nullable=False)

    # Changes (JSON format)
    changes: Mapped[dict] = mapped_column(
        nullable=False,
        default=dict,
        comment="Array of {field, old_value, new_value}"
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        nullable=False,
        index=True
    )

    def __repr__(self) -> str:
        return f"<ActivityLog {self.action} on {self.entity_type} {self.entity_id}>"

"""Activity log service for audit trail."""
from datetime import datetime
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_log import ActivityLog
from app.schemas.activity_log import ActivityLogResponse, ChangeDetail


class ActivityLogService:
    """Service for creating and retrieving activity logs."""

    def __init__(self, db: AsyncSession, company_id: Optional[UUID] = None):
        self.db = db
        self.company_id = company_id

    async def log_activity(
        self,
        deal_id: UUID,
        action: str,
        entity_type: str,
        entity_id: UUID,
        changes: Optional[List[ChangeDetail]] = None,
        user_id: Optional[Union[str, UUID]] = None,
        company_id: Optional[UUID] = None,
    ) -> ActivityLogResponse:
        """
        Create an activity log entry.

        Args:
            deal_id: The deal being modified
            action: Action type (created, updated, status_changed, deleted)
            entity_type: Type of entity (always "deal" for M1)
            entity_id: ID of the entity
            changes: List of field changes
            user_id: User who made the change

        Returns:
            ActivityLogResponse with created log entry
        """
        changes_list = changes or []
        changes_dict = [
            {"field": c.field, "old_value": c.old_value, "new_value": c.new_value}
            for c in changes_list
        ]

        # Convert user_id to UUID if it's a valid UUID string, otherwise None
        user_id_uuid = None
        if user_id:
            try:
                if isinstance(user_id, UUID):
                    user_id_uuid = user_id
                else:
                    user_id_uuid = UUID(user_id)
            except (ValueError, AttributeError):
                # user_id is not a valid UUID (e.g., "test-user"), skip it
                pass

        # Use company_id from parameter or from self
        log_company_id = company_id or self.company_id

        activity_log = ActivityLog(
            company_id=log_company_id,
            deal_id=deal_id,
            user_id=user_id_uuid,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            changes=changes_dict,
        )

        self.db.add(activity_log)
        await self.db.flush()

        return ActivityLogResponse.model_validate(activity_log)

    @staticmethod
    def compute_changes(
        old_data: Optional[Dict[str, Any]], new_data: Dict[str, Any]
    ) -> List[ChangeDetail]:
        """
        Compute field-level changes between old and new data.

        Args:
            old_data: Original values (None for creation)
            new_data: New values

        Returns:
            List of ChangeDetail objects
        """
        changes = []
        old_data = old_data or {}

        # Check all fields in new_data
        for field, new_value in new_data.items():
            old_value = old_data.get(field)

            # Skip if value hasn't changed
            if old_value == new_value:
                continue

            # Convert to strings for storage
            old_str = str(old_value) if old_value is not None else None
            new_str = str(new_value) if new_value is not None else None

            changes.append(
                ChangeDetail(field=field, old_value=old_str, new_value=new_str)
            )

        # Check for deleted fields
        for field, old_value in old_data.items():
            if field not in new_data and old_value is not None:
                changes.append(
                    ChangeDetail(
                        field=field, old_value=str(old_value), new_value=None
                    )
                )

        return changes

    async def get_deal_activity_logs(
        self, deal_id: UUID, skip: int = 0, limit: int = 50
    ) -> tuple[List[ActivityLogResponse], int]:
        """
        Retrieve activity logs for a deal.

        Args:
            deal_id: The deal ID
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            Tuple of (logs, total_count)
        """
        # Get total count (filter by company)
        count_result = await self.db.execute(
            select(func.count())
            .select_from(ActivityLog)
            .where(
                (ActivityLog.deal_id == deal_id)
                & (ActivityLog.company_id == self.company_id)
            )
        )
        total = count_result.scalar() or 0

        # Get paginated results, ordered by created_at DESC (newest first)
        query = (
            select(ActivityLog)
            .where(
                (ActivityLog.deal_id == deal_id)
                & (ActivityLog.company_id == self.company_id)
            )
            .order_by(ActivityLog.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        logs = result.scalars().all()

        return (
            [ActivityLogResponse.model_validate(log) for log in logs],
            total,
        )

    async def get_entity_activity_logs(
        self, entity_type: str, entity_id: UUID, skip: int = 0, limit: int = 50
    ) -> tuple[List[ActivityLogResponse], int]:
        """
        Retrieve activity logs for any entity (generic method).

        Args:
            entity_type: The type of entity (e.g., "quote", "customer")
            entity_id: The entity ID
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            Tuple of (logs, total_count)
        """
        # Get total count (filter by company)
        count_result = await self.db.execute(
            select(func.count())
            .select_from(ActivityLog)
            .where(
                (ActivityLog.entity_type == entity_type)
                & (ActivityLog.entity_id == entity_id)
                & (ActivityLog.company_id == self.company_id)
            )
        )
        total = count_result.scalar() or 0

        # Get paginated results, ordered by created_at DESC (newest first)
        query = (
            select(ActivityLog)
            .where(
                (ActivityLog.entity_type == entity_type)
                & (ActivityLog.entity_id == entity_id)
                & (ActivityLog.company_id == self.company_id)
            )
            .order_by(ActivityLog.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(query)
        logs = result.scalars().all()

        return (
            [ActivityLogResponse.model_validate(log) for log in logs],
            total,
        )

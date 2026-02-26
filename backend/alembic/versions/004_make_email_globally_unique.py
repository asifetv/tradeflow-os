"""Make email globally unique across all companies.

Email addresses are globally unique by definition - each email belongs to one person.

Revision ID: 004
Revises: 003
Create Date: 2026-02-19

"""
from alembic import op
import sqlalchemy as sa


revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Make email globally unique."""
    with op.batch_alter_table('user', schema=None) as batch_op:
        # Drop the old per-company unique index
        batch_op.drop_index('ix_user_email_company')
        # Create new global unique index
        batch_op.create_index('ix_user_email', ['email'], unique=True)


def downgrade() -> None:
    """Revert to per-company email uniqueness."""
    with op.batch_alter_table('user', schema=None) as batch_op:
        batch_op.drop_index('ix_user_email')
        batch_op.create_index('ix_user_email_company', ['email', 'company_id'], unique=True)

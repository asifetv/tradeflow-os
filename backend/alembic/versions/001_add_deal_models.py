"""Add Deal and ActivityLog models for M1.

Revision ID: 001
Revises:
Create Date: 2026-02-17 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create deal table
    op.create_table(
        'deal',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('deal_number', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('customer_id', sa.UUID(), nullable=True),
        sa.Column('customer_rfq_ref', sa.String(200), nullable=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='AED'),
        sa.Column('line_items', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('total_value', sa.Float(), nullable=True),
        sa.Column('total_cost', sa.Float(), nullable=True),
        sa.Column('estimated_margin_pct', sa.Float(), nullable=True),
        sa.Column('actual_margin_pct', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('deal_number'),
        sa.CheckConstraint(
            "status IN ('rfq_received', 'sourcing', 'quoted', 'po_received', 'ordered', 'in_production', 'shipped', 'delivered', 'invoiced', 'paid', 'closed', 'cancelled')",
            name='ck_deal_status_valid'
        ),
        sa.Index('ix_deal_status', 'status'),
        sa.Index('ix_deal_customer_id', 'customer_id'),
        sa.Index('ix_deal_created_at', 'created_at'),
    )

    # Create activity_log table
    op.create_table(
        'activity_log',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('deal_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', sa.UUID(), nullable=False),
        sa.Column('changes', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['deal_id'], ['deal.id']),
        sa.Index('ix_activity_log_deal_id', 'deal_id'),
        sa.Index('ix_activity_log_created_at', 'created_at'),
    )


def downgrade() -> None:
    op.drop_table('activity_log')
    op.drop_table('deal')

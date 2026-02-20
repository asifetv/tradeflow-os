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
    # Create customer table
    op.create_table(
        'customer',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('customer_code', sa.String(50), nullable=False),
        sa.Column('company_name', sa.String(200), nullable=False),
        sa.Column('country', sa.String(100), nullable=False),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('primary_contact_name', sa.String(200), nullable=True),
        sa.Column('primary_contact_email', sa.String(255), nullable=True),
        sa.Column('primary_contact_phone', sa.String(50), nullable=True),
        sa.Column('payment_terms', sa.String(200), nullable=True),
        sa.Column('credit_limit', sa.Float(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('customer_code'),
        sa.Index('ix_customer_created_at', 'created_at'),
    )

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

    # Create quote table
    op.create_table(
        'quote',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('quote_number', sa.String(50), nullable=False),
        sa.Column('customer_id', sa.UUID(), nullable=False),
        sa.Column('deal_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(10), nullable=False, server_default='AED'),
        sa.Column('validity_days', sa.Integer(), nullable=True),
        sa.Column('line_items', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('quote_number'),
        sa.ForeignKeyConstraint(['customer_id'], ['customer.id']),
        sa.ForeignKeyConstraint(['deal_id'], ['deal.id']),
        sa.Index('ix_quote_customer_id', 'customer_id'),
        sa.Index('ix_quote_deal_id', 'deal_id'),
        sa.Index('ix_quote_status', 'status'),
    )

    # Create customer_po table
    op.create_table(
        'customer_po',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('internal_ref', sa.String(50), nullable=False),
        sa.Column('po_number', sa.String(50), nullable=False),
        sa.Column('customer_id', sa.UUID(), nullable=False),
        sa.Column('deal_id', sa.UUID(), nullable=False),
        sa.Column('quote_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(10), nullable=False, server_default='AED'),
        sa.Column('po_date', sa.Date(), nullable=False),
        sa.Column('line_items', postgresql.JSON(), nullable=False, server_default='{}'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('internal_ref'),
        sa.ForeignKeyConstraint(['customer_id'], ['customer.id']),
        sa.ForeignKeyConstraint(['deal_id'], ['deal.id']),
        sa.ForeignKeyConstraint(['quote_id'], ['quote.id']),
        sa.Index('ix_customer_po_customer_id', 'customer_id'),
        sa.Index('ix_customer_po_deal_id', 'deal_id'),
        sa.Index('ix_customer_po_quote_id', 'quote_id'),
        sa.Index('ix_customer_po_status', 'status'),
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
    op.drop_table('customer_po')
    op.drop_table('quote')
    op.drop_table('deal')
    op.drop_table('customer')

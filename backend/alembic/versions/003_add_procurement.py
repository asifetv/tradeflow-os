"""Add M3 Procurement - vendors and proposals tables

Revision ID: 003
Revises: 002
Create Date: 2026-02-19
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add procurement module tables."""

    # Create vendors table
    op.create_table(
        'vendors',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('vendor_code', sa.String(50), nullable=False),
        sa.Column('company_name', sa.String(200), nullable=False),
        sa.Column('country', sa.String(100), nullable=False),
        sa.Column('certifications', sa.JSON(), nullable=True),
        sa.Column('product_categories', sa.JSON(), nullable=True),
        sa.Column('credibility_score', sa.Integer(), nullable=False, server_default='50'),
        sa.Column('on_time_delivery_rate', sa.Float(), nullable=True),
        sa.Column('quality_score', sa.Integer(), nullable=True),
        sa.Column('avg_lead_time_days', sa.Integer(), nullable=True),
        sa.Column('primary_contact_name', sa.String(200), nullable=True),
        sa.Column('primary_contact_email', sa.String(255), nullable=True),
        sa.Column('primary_contact_phone', sa.String(50), nullable=True),
        sa.Column('payment_terms', sa.String(200), nullable=True),
        sa.Column('bank_details', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('notes', sa.String(2000), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_vendor_code_company', 'vendors', ['vendor_code', 'company_id'], unique=True)
    op.create_index('ix_vendors_company_name', 'vendors', ['company_name'])
    op.create_index('ix_vendors_credibility_score', 'vendors', ['credibility_score'])

    # Create vendor_proposals table
    op.create_table(
        'vendor_proposals',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('deal_id', sa.UUID(), nullable=False),
        sa.Column('vendor_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='requested'),
        sa.Column('line_items', sa.JSON(), nullable=True),
        sa.Column('total_price', sa.Numeric(precision=15, scale=2), nullable=True),
        sa.Column('currency', sa.String(10), nullable=False, server_default='AED'),
        sa.Column('lead_time_days', sa.Integer(), nullable=True),
        sa.Column('payment_terms', sa.String(500), nullable=True),
        sa.Column('validity_date', sa.Date(), nullable=True),
        sa.Column('specs_match', sa.Boolean(), nullable=True),
        sa.Column('discrepancies', sa.JSON(), nullable=True),
        sa.Column('notes', sa.String(2000), nullable=True),
        sa.Column('raw_document_url', sa.String(500), nullable=True),
        sa.Column('parsed_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
        sa.ForeignKeyConstraint(['deal_id'], ['deal.id'], ),
        sa.ForeignKeyConstraint(['vendor_id'], ['vendors.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_vendor_proposals_deal_id', 'vendor_proposals', ['deal_id'])
    op.create_index('ix_vendor_proposals_vendor_id', 'vendor_proposals', ['vendor_id'])
    op.create_index('ix_vendor_proposals_company_id', 'vendor_proposals', ['company_id'])


def downgrade() -> None:
    """Revert procurement module tables."""
    op.drop_index('ix_vendor_proposals_company_id', table_name='vendor_proposals')
    op.drop_index('ix_vendor_proposals_vendor_id', table_name='vendor_proposals')
    op.drop_index('ix_vendor_proposals_deal_id', table_name='vendor_proposals')
    op.drop_table('vendor_proposals')

    op.drop_index('ix_vendors_credibility_score', table_name='vendors')
    op.drop_index('ix_vendors_company_name', table_name='vendors')
    op.drop_index('ix_vendor_code_company', table_name='vendors')
    op.drop_table('vendors')

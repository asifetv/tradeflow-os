"""Add M4 Document Management - documents table

Revision ID: 005
Revises: 004
Create Date: 2026-02-23
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add document management table."""

    # Create documents table
    op.create_table(
        'documents',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=True),
        sa.Column('entity_id', sa.UUID(), nullable=True),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('storage_bucket', sa.String(100), nullable=False),
        sa.Column('storage_key', sa.String(500), nullable=False),
        sa.Column('original_filename', sa.String(500), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=False),
        sa.Column('extracted_text', sa.Text(), nullable=True),
        sa.Column('parsed_data', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='uploading'),
        sa.Column('ai_confidence_score', sa.Float(), nullable=True),
        sa.Column('error_message', sa.String(1000), nullable=True),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_documents_company_id', 'documents', ['company_id'])
    op.create_index('ix_documents_entity_type', 'documents', ['entity_type'])
    op.create_index('ix_document_entity', 'documents', ['entity_type', 'entity_id'])
    op.create_index('ix_document_company_only', 'documents', ['company_id', 'deleted_at'])
    op.create_index('ix_document_category_company', 'documents', ['category', 'company_id', 'deleted_at'])
    op.create_index('ix_documents_status', 'documents', ['status'])
    op.create_index('ix_documents_created_at', 'documents', ['created_at'])


def downgrade() -> None:
    """Remove document management table."""
    op.drop_table('documents')

"""Add multi-tenancy support - company, user, and company_id to all entities

Revision ID: 002
Revises: 001
Create Date: 2026-02-19

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Apply multi-tenancy schema changes."""

    # Create company table
    op.create_table(
        'company',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('company_name', sa.String(length=200), nullable=False),
        sa.Column('subdomain', sa.String(length=50), nullable=False),
        sa.Column('country', sa.String(length=100), nullable=True),
        sa.Column('plan_tier', sa.String(length=50), nullable=False, server_default='trial'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('trial_ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_company_subdomain', 'company', ['subdomain'], unique=True)
    op.create_index('ix_company_created_at', 'company', ['created_at'])

    # Create user table
    op.create_table(
        'user',
        sa.Column('id', sa.String(36), nullable=False),
        sa.Column('company_id', sa.String(36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=200), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='user'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['company_id'], ['company.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_user_email_company', 'user', ['email', 'company_id'], unique=True)
    op.create_index('ix_user_company_id', 'user', ['company_id'])

    # Add company_id to deal table using batch mode (needed for SQLite)
    # batch_alter_table recreates the table, so old indexes are automatically removed
    with op.batch_alter_table('deal', schema=None) as batch_op:
        batch_op.add_column(sa.Column('company_id', sa.String(36), nullable=True))
        batch_op.create_foreign_key('fk_deal_company_id', 'company', ['company_id'], ['id'])
        batch_op.create_index('ix_deals_company_id', ['company_id'])
        batch_op.create_index('ix_deal_number_company', ['deal_number', 'company_id'], unique=True)
        batch_op.create_index('ix_deals_status', ['status'])

    # Add company_id to customer table using batch mode
    with op.batch_alter_table('customer', schema=None) as batch_op:
        batch_op.add_column(sa.Column('company_id', sa.String(36), nullable=True))
        batch_op.create_foreign_key('fk_customer_company_id', 'company', ['company_id'], ['id'])
        batch_op.create_index('ix_customers_company_id', ['company_id'])
        batch_op.create_index('ix_customer_code_company', ['customer_code', 'company_id'], unique=True)
        batch_op.create_index('ix_customers_is_active', ['is_active'])

    # Add company_id to quote table using batch mode
    with op.batch_alter_table('quote', schema=None) as batch_op:
        batch_op.add_column(sa.Column('company_id', sa.String(36), nullable=True))
        batch_op.create_foreign_key('fk_quote_company_id', 'company', ['company_id'], ['id'])
        batch_op.create_index('ix_quotes_company_id', ['company_id'])
        batch_op.create_index('ix_quote_number_company', ['quote_number', 'company_id'], unique=True)
        batch_op.create_index('ix_quotes_customer_id', ['customer_id'])
        batch_op.create_index('ix_quotes_deal_id', ['deal_id'])
        batch_op.create_index('ix_quotes_status', ['status'])

    # Add company_id to customer_po table using batch mode
    with op.batch_alter_table('customer_po', schema=None) as batch_op:
        batch_op.add_column(sa.Column('company_id', sa.String(36), nullable=True))
        batch_op.create_foreign_key('fk_customer_po_company_id', 'company', ['company_id'], ['id'])
        batch_op.create_index('ix_customer_pos_company_id', ['company_id'])
        batch_op.create_index('ix_internal_ref_company', ['internal_ref', 'company_id'], unique=True)
        batch_op.create_index('ix_customer_pos_customer_id', ['customer_id'])
        batch_op.create_index('ix_customer_pos_deal_id', ['deal_id'])
        batch_op.create_index('ix_customer_pos_quote_id', ['quote_id'])
        batch_op.create_index('ix_customer_pos_status', ['status'])

    # Add company_id to activity_log table using batch mode
    with op.batch_alter_table('activity_log', schema=None) as batch_op:
        batch_op.add_column(sa.Column('company_id', sa.String(36), nullable=True))
        batch_op.create_foreign_key('fk_activity_log_company_id', 'company', ['company_id'], ['id'])
        batch_op.create_index('ix_activity_logs_company_id', ['company_id'])
        batch_op.create_index('ix_activity_logs_entity', ['entity_type', 'entity_id'])


def downgrade() -> None:
    """Revert multi-tenancy schema changes."""

    # Remove activity_log changes
    with op.batch_alter_table('activity_log', schema=None) as batch_op:
        batch_op.drop_constraint('fk_activity_log_company_id', type_='foreignkey')
        batch_op.drop_column('company_id')

    # Remove customer_po changes
    with op.batch_alter_table('customer_po', schema=None) as batch_op:
        batch_op.drop_constraint('fk_customer_po_company_id', type_='foreignkey')
        batch_op.drop_column('company_id')

    # Remove quote changes
    with op.batch_alter_table('quote', schema=None) as batch_op:
        batch_op.drop_constraint('fk_quote_company_id', type_='foreignkey')
        batch_op.drop_column('company_id')

    # Remove customer changes
    with op.batch_alter_table('customer', schema=None) as batch_op:
        batch_op.drop_constraint('fk_customer_company_id', type_='foreignkey')
        batch_op.drop_column('company_id')

    # Remove deal changes
    with op.batch_alter_table('deal', schema=None) as batch_op:
        batch_op.drop_constraint('fk_deal_company_id', type_='foreignkey')
        batch_op.drop_column('company_id')

    # Remove user table
    op.drop_table('user')

    # Remove company table
    op.drop_table('company')

"""add email verification otp fields

Revision ID: 0002_add_otp_fields
Revises: 0001_initial
Create Date: 2026-07-25

"""
from alembic import op
import sqlalchemy as sa

revision = "0002_add_otp_fields"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("verification_otp", sa.String(length=6), nullable=True))
    op.add_column("users", sa.Column("verification_otp_expires", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "verification_otp_expires")
    op.drop_column("users", "verification_otp")

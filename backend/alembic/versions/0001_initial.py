"""Initial schema - users, predictions, feedback

Revision ID: 0001_initial
Revises:
Create Date: 2026-07-25

"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=200), server_default=""),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true()),
        sa.Column("is_admin", sa.Boolean(), server_default=sa.false()),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.false()),
        sa.Column("verification_token", sa.String(length=255), nullable=True),
        sa.Column("reset_token", sa.String(length=255), nullable=True),
        sa.Column("reset_token_expires", sa.DateTime(), nullable=True),
        sa.Column("google_id", sa.String(length=255), nullable=True),
        sa.Column("auth_provider", sa.String(length=50), server_default="local"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_verification_token", "users", ["verification_token"])
    op.create_index("ix_users_reset_token", "users", ["reset_token"])
    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)

    op.create_table(
        "predictions",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("nitrogen", sa.Float(), nullable=False),
        sa.Column("phosphorus", sa.Float(), nullable=False),
        sa.Column("potassium", sa.Float(), nullable=False),
        sa.Column("temperature", sa.Float(), nullable=False),
        sa.Column("humidity", sa.Float(), nullable=False),
        sa.Column("ph", sa.Float(), nullable=False),
        sa.Column("rainfall", sa.Float(), nullable=False),
        sa.Column("predicted_crop", sa.String(length=100), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("top_crops", sa.Text(), server_default=""),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "feedback",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("prediction_id", sa.Integer(), sa.ForeignKey("predictions.id"), nullable=True),
        sa.Column("rating", sa.Integer(), server_default="0"),
        sa.Column("comment", sa.Text(), server_default=""),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("feedback")
    op.drop_table("predictions")
    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_index("ix_users_reset_token", table_name="users")
    op.drop_index("ix_users_verification_token", table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

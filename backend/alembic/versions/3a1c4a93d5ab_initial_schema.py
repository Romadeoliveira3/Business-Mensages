"""Initial database schema for business messages.

Revision ID: 3a1c4a93d5ab
Revises: 
Create Date: 2025-10-01
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "3a1c4a93d5ab"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create table: business_messages
    op.create_table(
        "business_messages",
        sa.Column("id", sa.String(length=64), primary_key=True, nullable=False),
        sa.Column("message_key", sa.String(length=255), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("variables", sa.JSON(), nullable=False),
        sa.Column("http_status", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_by", sa.String(length=255), nullable=False),
        sa.UniqueConstraint(
            "message_key",
            "version",
            name="uq_business_messages_key_version",
        ),
    )

    # Create table: message_history
    op.create_table(
        "message_history",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "message_id",
            sa.String(length=64),
            sa.ForeignKey("business_messages.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_by", sa.String(length=255), nullable=False),
        sa.Column("changes", sa.Text(), nullable=False),
        sa.UniqueConstraint(
            "message_id",
            "version",
            name="uq_message_history_message_version",
        ),
    )


def downgrade() -> None:
    # Drop child table first due to FK dependency
    op.drop_table("message_history")
    op.drop_table("business_messages")


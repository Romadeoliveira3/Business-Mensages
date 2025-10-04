"""Initial database schema."""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "3a1c4a93d5ab"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "business_messages",
        sa.Column("id", sa.String(length=64), primary_key=True, nullable=False),
        sa.Column("message_key", sa.String(length=255), nullable=False, unique=True),
        sa.Column("code", sa.String(length=32), nullable=False, unique=True),
    )

    op.create_table(
        "languages",
        sa.Column("code", sa.String(length=16), primary_key=True, nullable=False),
    )

    op.create_table(
        "message_translations",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "message_id",
            sa.String(length=64),
            sa.ForeignKey("business_messages.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "language_code",
            sa.String(length=16),
            sa.ForeignKey("languages.code", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.UniqueConstraint(
            "message_id",
            "language_code",
            name="uq_message_translation_message_language",
        ),
    )


def downgrade() -> None:
    op.drop_table("message_translations")
    op.drop_table("languages")
    op.drop_table("business_messages")

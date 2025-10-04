"""Drop language name column

Revision ID: 9f2b7e5b2b9e
Revises: 4c8adf8a91b9
Create Date: 2025-10-03
"""

from __future__ import annotations

from typing import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9f2b7e5b2b9e"
down_revision: str | None = "4c8adf8a91b9"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("languages") as batch_op:
        batch_op.drop_column("name")


def downgrade() -> None:
    # Recreate the column with a non-null default, then drop the default.
    with op.batch_alter_table("languages") as batch_op:
        batch_op.add_column(
            sa.Column("name", sa.String(length=255), nullable=False, server_default="")
        )
    with op.batch_alter_table("languages") as batch_op:
        batch_op.alter_column("name", server_default=None)


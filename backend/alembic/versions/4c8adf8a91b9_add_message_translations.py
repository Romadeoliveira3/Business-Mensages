"""No-op migration retained for backwards compatibility."""

from __future__ import annotations

# revision identifiers, used by Alembic.
revision: str = "4c8adf8a91b9"
down_revision: str | None = "3a1c4a93d5ab"
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

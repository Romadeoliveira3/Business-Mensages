"""No-op migration retained for backwards compatibility."""

from __future__ import annotations

# revision identifiers, used by Alembic.
revision: str = "9f2b7e5b2b9e"
down_revision: str | None = "4c8adf8a91b9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

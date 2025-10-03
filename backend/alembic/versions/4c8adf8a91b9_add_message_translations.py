"""Add tables for message translations and languages"""

from __future__ import annotations

from typing import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "4c8adf8a91b9"
down_revision: str | None = "3a1c4a93d5ab"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "languages",
        sa.Column("code", sa.String(length=16), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
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
        sa.Column("body", sa.Text(), nullable=False),
        sa.UniqueConstraint(
            "message_id",
            "language_code",
            name="uq_message_translation_message_language",
        ),
    )

    connection = op.get_bind()

    languages_table = sa.table(
        "languages",
        sa.column("code", sa.String(length=16)),
        sa.column("name", sa.String(length=255)),
    )
    op.bulk_insert(
        languages_table,
        [
            {"code": "en", "name": "English"},
            {"code": "pt-BR", "name": "Português (Brasil)"},
        ],
    )

    business_messages = sa.table(
        "business_messages",
        sa.column("id", sa.String(length=64)),
        sa.column("title", sa.String(length=255)),
        sa.column("body", sa.Text()),
    )
    rows = connection.execute(sa.select(business_messages.c.id, business_messages.c.title, business_messages.c.body)).fetchall()
    if rows:
        translations_table = sa.table(
            "message_translations",
            sa.column("message_id", sa.String(length=64)),
            sa.column("language_code", sa.String(length=16)),
            sa.column("title", sa.String(length=255)),
            sa.column("body", sa.Text()),
        )
        op.bulk_insert(
            translations_table,
            [
                {
                    "message_id": row.id,
                    "language_code": "en",
                    "title": row.title,
                    "body": row.body,
                }
                for row in rows
            ],
        )

    with op.batch_alter_table("business_messages") as batch_op:
        batch_op.drop_column("title")
        batch_op.drop_column("body")


def downgrade() -> None:
    with op.batch_alter_table("business_messages") as batch_op:
        batch_op.add_column(
            sa.Column("body", sa.Text(), nullable=False, server_default=""),
        )
        batch_op.add_column(
            sa.Column("title", sa.String(length=255), nullable=False, server_default=""),
        )

    connection = op.get_bind()

    translations_table = sa.table(
        "message_translations",
        sa.column("message_id", sa.String(length=64)),
        sa.column("language_code", sa.String(length=16)),
        sa.column("title", sa.String(length=255)),
        sa.column("body", sa.Text()),
    )

    business_messages = sa.table(
        "business_messages",
        sa.column("id", sa.String(length=64)),
        sa.column("title", sa.String(length=255)),
        sa.column("body", sa.Text()),
    )

    rows = connection.execute(
        sa.select(
            translations_table.c.message_id,
            translations_table.c.title,
            translations_table.c.body,
        ).where(translations_table.c.language_code == "en")
    ).fetchall()

    for row in rows:
        connection.execute(
            business_messages.update()
            .where(business_messages.c.id == row.message_id)
            .values(title=row.title, body=row.body)
        )

    with op.batch_alter_table("business_messages") as batch_op:
        batch_op.alter_column("title", server_default=None)
        batch_op.alter_column("body", server_default=None)

    op.drop_table("message_translations")
    op.drop_table("languages")

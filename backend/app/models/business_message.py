"""SQLAlchemy models representing business messages."""

from __future__ import annotations

from typing import List

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class BusinessMessage(Base):
    """A business domain message that can be rendered dynamically."""

    __tablename__ = "business_messages"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    message_key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    code: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)

    translations: Mapped[List["MessageTranslation"]] = relationship(
        back_populates="message",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Language(Base):
    """Supported language registered for message translations."""

    __tablename__ = "languages"

    code: Mapped[str] = mapped_column(String(16), primary_key=True)

    translations: Mapped[List["MessageTranslation"]] = relationship(
        back_populates="language",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class MessageTranslation(Base):
    """Language specific representation of a business message."""

    __tablename__ = "message_translations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    message_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("business_messages.id", ondelete="CASCADE"),
        nullable=False,
    )
    language_code: Mapped[str] = mapped_column(
        String(16),
        ForeignKey("languages.code", ondelete="RESTRICT"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)

    message: Mapped[BusinessMessage] = relationship(back_populates="translations")
    language: Mapped[Language] = relationship(back_populates="translations")

    __table_args__ = (
        UniqueConstraint(
            "message_id",
            "language_code",
            name="uq_message_translation_message_language",
        ),
    )

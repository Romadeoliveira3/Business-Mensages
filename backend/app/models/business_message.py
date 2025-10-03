"""SQLAlchemy models representing business messages and their history."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base_class import Base


class BusinessMessage(Base):
    """A business domain message that can be rendered dynamically."""

    __tablename__ = "business_messages"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    message_key: Mapped[str] = mapped_column(String(255), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    variables: Mapped[List[str]] = mapped_column(JSON, nullable=False, default=list)
    http_status: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_by: Mapped[str] = mapped_column(String(255), nullable=False)

    history: Mapped[List["MessageHistory"]] = relationship(
        back_populates="message",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    translations: Mapped[List["MessageTranslation"]] = relationship(
        back_populates="message",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    __table_args__ = (
        UniqueConstraint(
            "message_key",
            "version",
            name="uq_business_messages_key_version",
        ),
    )


class Language(Base):
    """Supported language registered for message translations."""

    __tablename__ = "languages"

    code: Mapped[str] = mapped_column(String(16), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

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
    body: Mapped[str] = mapped_column(Text, nullable=False)

    message: Mapped[BusinessMessage] = relationship(back_populates="translations")
    language: Mapped[Language] = relationship(back_populates="translations")

    __table_args__ = (
        UniqueConstraint(
            "message_id",
            "language_code",
            name="uq_message_translation_message_language",
        ),
    )


class MessageHistory(Base):
    """Track the change history of a message per version."""

    __tablename__ = "message_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    message_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("business_messages.id", ondelete="CASCADE"),
        nullable=False,
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_by: Mapped[str] = mapped_column(String(255), nullable=False)
    changes: Mapped[str] = mapped_column(Text, nullable=False)

    message: Mapped[BusinessMessage] = relationship(back_populates="history")

    __table_args__ = (
        UniqueConstraint(
            "message_id",
            "version",
            name="uq_message_history_message_version",
        ),
    )

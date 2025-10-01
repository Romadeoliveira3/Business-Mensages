"""Service layer operations for managing business messages."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.business_message import BusinessMessage, MessageHistory
from app.schemas import BusinessMessageCreate, BusinessMessageUpdate


class MessageServiceError(RuntimeError):
    """Base error raised by message service functions."""


class MessageConflictError(MessageServiceError):
    """Raised when a unique constraint conflict occurs."""


def list_messages(db: Session) -> list[BusinessMessage]:
    """Return all business messages ordered by key and version."""

    stmt = (
        select(BusinessMessage)
        .options(joinedload(BusinessMessage.history))
        .order_by(BusinessMessage.message_key, BusinessMessage.version.desc())
    )
    return list(db.scalars(stmt))


def get_message(db: Session, message_id: str) -> Optional[BusinessMessage]:
    """Fetch a single message by its identifier."""

    stmt = (
        select(BusinessMessage)
        .options(joinedload(BusinessMessage.history))
        .where(BusinessMessage.id == message_id)
    )
    return db.scalars(stmt).first()


def _record_history(
    db: Session,
    message: BusinessMessage,
    *,
    version: int,
    updated_by: str,
    updated_at: datetime,
    changes: str,
) -> None:
    """Persist a history entry for the provided message."""

    history_entry = MessageHistory(
        message_id=message.id,
        version=version,
        updated_at=updated_at,
        updated_by=updated_by,
        changes=changes,
    )
    db.add(history_entry)


def create_message(db: Session, message_in: BusinessMessageCreate) -> BusinessMessage:
    """Create a new business message and persist a history entry."""

    now = datetime.utcnow()
    message_id = message_in.id or uuid4().hex
    message = BusinessMessage(
        id=message_id,
        message_key=message_in.message_key,
        version=message_in.version,
        title=message_in.title,
        body=message_in.body,
        variables=message_in.variables,
        http_status=message_in.http_status,
        created_at=now,
        updated_at=now,
        updated_by=message_in.updated_by,
    )
    db.add(message)

    _record_history(
        db,
        message,
        version=message.version,
        updated_by=message.updated_by,
        updated_at=now,
        changes="Created message",
    )

    try:
        db.commit()
    except IntegrityError as exc:  # pragma: no cover - defensive guard
        db.rollback()
        raise MessageConflictError("Message with same key/version already exists") from exc

    db.refresh(message)
    db.refresh(message, attribute_names=["history"])
    return message


def update_message(
    db: Session,
    message: BusinessMessage,
    message_in: BusinessMessageUpdate,
) -> BusinessMessage:
    """Update an existing message, bumping its version and recording history."""

    payload = message_in.model_dump(exclude_unset=True)
    if not payload:
        return message

    now = datetime.utcnow()
    changes: dict[str, dict[str, Optional[str]]] = {}

    for field, value in payload.items():
        old_value = getattr(message, field)
        if value != old_value:
            changes[field] = {"old": old_value, "new": value}
            setattr(message, field, value)

    if "updated_by" not in payload:
        # Ensure we persist who performed the update even when not provided.
        payload.setdefault("updated_by", message.updated_by)

    message.version += 1
    message.updated_at = now

    change_summary = (
        "No substantive changes"
        if not changes
        else json.dumps(changes, ensure_ascii=False)
    )

    _record_history(
        db,
        message,
        version=message.version,
        updated_by=payload.get("updated_by", message.updated_by),
        updated_at=now,
        changes=change_summary,
    )

    try:
        db.commit()
    except IntegrityError as exc:  # pragma: no cover - defensive guard
        db.rollback()
        raise MessageConflictError("Message with same key/version already exists") from exc

    db.refresh(message)
    db.refresh(message, attribute_names=["history"])
    return message


def delete_message(db: Session, message: BusinessMessage) -> None:
    """Delete a business message and its history."""

    db.delete(message)
    db.commit()

from __future__ import annotations

import json
from datetime import datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.business_message import (
    BusinessMessage,
    Language,
    MessageHistory,
    MessageTranslation,
)
from app.schemas import BusinessMessageCreate, BusinessMessageUpdate


class MessageServiceError(RuntimeError):
    """Base error raised by message service functions."""


class MessageConflictError(MessageServiceError):
    """Raised when a unique constraint conflict occurs."""


def list_messages(db: Session) -> list[BusinessMessage]:
    """Return all business messages ordered by key and version."""

    stmt = (
        select(BusinessMessage)
        .options(
            joinedload(BusinessMessage.history),
            joinedload(BusinessMessage.translations).joinedload(MessageTranslation.language),
        )
        .order_by(BusinessMessage.message_key, BusinessMessage.version.desc())
    )
    # Use unique() para evitar resultados duplicados com joinedload em coleções
    return list(db.scalars(stmt).unique())


def get_message(db: Session, message_id: str) -> BusinessMessage | None:
    """Fetch a single message by its identifier."""

    stmt = (
        select(BusinessMessage)
        .options(
            joinedload(BusinessMessage.history),
            joinedload(BusinessMessage.translations).joinedload(MessageTranslation.language),
        )
        .where(BusinessMessage.id == message_id)
    )
    # Mesmo para operações .first(), usamos unique() para consistência
    return db.scalars(stmt).unique().first()


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


def _ensure_language(db: Session, code: str, name: str | None = None) -> Language:
    """Return an existing ``Language`` row or create a new one."""

    normalised = code.strip()
    language = db.get(Language, normalised)
    if language is not None:
        if name and language.name != name:
            language.name = name
        return language

    language = Language(code=normalised, name=name or normalised)
    db.add(language)
    db.flush()
    return language


def create_message(db: Session, message_in: BusinessMessageCreate) -> BusinessMessage:
    """Create a new business message and persist a history entry."""

    if not message_in.translations:
        raise MessageServiceError("At least one translation must be provided")

    now = datetime.utcnow()
    message_id = message_in.id or uuid4().hex
    message = BusinessMessage(
        id=message_id,
        message_key=message_in.message_key,
        version=message_in.version,
        variables=message_in.variables,
        http_status=message_in.http_status,
        created_at=now,
        updated_at=now,
        updated_by=message_in.updated_by,
    )
    db.add(message)

    for translation_in in message_in.translations:
        language = _ensure_language(
            db,
            translation_in.language_code,
            translation_in.language_name,
        )
        message.translations.append(
            MessageTranslation(
                message_id=message_id,
                language_code=language.code,
                title=translation_in.title,
                body=translation_in.body,
            )
        )

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
    db.refresh(message, attribute_names=["history", "translations"])
    return message


def update_message(
    db: Session,
    message: BusinessMessage,
    message_in: BusinessMessageUpdate,
) -> BusinessMessage:
    """Update an existing message, bumping its version and recording history."""

    payload = message_in.model_dump(exclude_unset=True, exclude={"translations"})
    # Access translations via the typed attribute to keep Pydantic models
    translations_payload = message_in.translations
    if not payload and translations_payload is None:
        return message


    now = datetime.utcnow()
    changes: dict[str, Any] = {}

    for field, value in payload.items():
        old_value = getattr(message, field)
        if value != old_value:
            changes[field] = {"old": old_value, "new": value}
            setattr(message, field, value)

    if translations_payload is not None:
        existing = {translation.language_code: translation for translation in message.translations}
        for translation_in in translations_payload:
            language = _ensure_language(
                db,
                translation_in.language_code,
                translation_in.language_name,
            )
            current = existing.get(language.code)
            change_key = f"translation:{language.code}"
            if current is None:
                message.translations.append(
                    MessageTranslation(
                        message_id=message.id,
                        language_code=language.code,
                        title=translation_in.title,
                        body=translation_in.body,
                    )
                )
                changes[change_key] = {
                    "old": None,
                    "new": {"title": translation_in.title, "body": translation_in.body},
                }
                continue

            translation_changes: dict[str, Any] = {}
            if translation_in.title != current.title:
                translation_changes["title"] = {"old": current.title, "new": translation_in.title}
                current.title = translation_in.title
            if translation_in.body != current.body:
                translation_changes["body"] = {"old": current.body, "new": translation_in.body}
                current.body = translation_in.body

            if translation_changes:
                changes[change_key] = translation_changes

    if "updated_by" not in payload:
        # Ensure we persist who performed the update even when not provided.
        message.updated_by = message_in.updated_by or message.updated_by
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
        updated_by=message.updated_by,
        updated_at=now,
        changes=change_summary,
    )

    try:
        db.commit()
    except IntegrityError as exc:  # pragma: no cover - defensive guard
        db.rollback()
        raise MessageConflictError("Message with same key/version already exists") from exc

    db.refresh(message)
    db.refresh(message, attribute_names=["history", "translations"])
    return message


def delete_message(db: Session, message: BusinessMessage) -> None:
    """Delete a business message and its history."""

    db.delete(message)
    db.commit()

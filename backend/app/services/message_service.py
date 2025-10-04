from __future__ import annotations

from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.business_message import BusinessMessage, Language, MessageTranslation
from app.schemas import BusinessMessageCreate, BusinessMessageUpdate

# ---------------------------------------------------------------------------
# Language handling: restrict to a predefined set and canonicalise codes
# ---------------------------------------------------------------------------

_ALLOWED_LANGS: set[str] = {"en", "es", "pt-br"}


def _normalise_lang_code(code: str) -> str:
    """Return canonical code for a supported language.

    - Accepts case-insensitive codes, dash/underscore variants (e.g. pt_br).
    - Maps plain "pt" to canonical "pt-BR".
    - Raises ``MessageServiceError`` for unsupported codes.
    """

    value = code.strip().replace("_", "-").lower()
    if value == "pt":
        value = "pt-br"
    if value not in _ALLOWED_LANGS:
        raise MessageServiceError(
            f"Unsupported language code '{code}'. Allowed: en, es, pt-BR"
        )
    return "pt-BR" if value == "pt-br" else value


class MessageServiceError(RuntimeError):
    """Base error raised by message service functions."""


class MessageConflictError(MessageServiceError):
    """Raised when a unique constraint conflict occurs."""


def list_messages(db: Session) -> list[BusinessMessage]:
    """Return all business messages ordered by key."""

    stmt = (
        select(BusinessMessage)
        .options(
            joinedload(BusinessMessage.translations).joinedload(MessageTranslation.language),
        )
        .order_by(BusinessMessage.message_key)
    )
    return list(db.scalars(stmt).unique())


def get_message(db: Session, message_id: str) -> BusinessMessage | None:
    """Fetch a single message by its identifier."""

    stmt = (
        select(BusinessMessage)
        .options(
            joinedload(BusinessMessage.translations).joinedload(MessageTranslation.language),
        )
        .where(BusinessMessage.id == message_id)
    )
    return db.scalars(stmt).unique().first()


def _ensure_language(db: Session, code: str) -> Language:
    """Return an existing ``Language`` row or create a new one."""

    canonical = _normalise_lang_code(code)
    language = db.get(Language, canonical)
    if language is not None:
        return language

    language = Language(code=canonical)
    db.add(language)
    db.flush()
    return language


def create_message(db: Session, message_in: BusinessMessageCreate) -> BusinessMessage:
    """Create a new business message."""

    message_id = message_in.id or uuid4().hex
    message = BusinessMessage(
        id=message_id,
        message_key=message_in.message_key,
        code=message_in.code,
    )
    db.add(message)

    for translation_in in message_in.translations:
        language = _ensure_language(db, translation_in.language_code)
        message.translations.append(
            MessageTranslation(
                message_id=message_id,
                language_code=language.code,
                title=translation_in.title,
            )
        )

    try:
        db.commit()
    except IntegrityError as exc:  # pragma: no cover - defensive guard
        db.rollback()
        raise MessageConflictError("Message with same key or code already exists") from exc

    db.refresh(message)
    db.refresh(message, attribute_names=["translations"])
    return message


def update_message(
    db: Session,
    message: BusinessMessage,
    message_in: BusinessMessageUpdate,
) -> BusinessMessage:
    """Update an existing message."""

    payload = message_in.model_dump(exclude_unset=True, exclude={"translations"})
    translations_payload = message_in.translations
    if not payload and translations_payload is None:
        return message

    for field, value in payload.items():
        setattr(message, field, value)

    if translations_payload is not None:
        existing = {translation.language_code: translation for translation in message.translations}
        incoming_codes: set[str] = set()

        for translation_in in translations_payload:
            language = _ensure_language(db, translation_in.language_code)
            incoming_codes.add(language.code)
            current = existing.get(language.code)
            if current is None:
                message.translations.append(
                    MessageTranslation(
                        message_id=message.id,
                        language_code=language.code,
                        title=translation_in.title,
                    )
                )
                continue

            current.title = translation_in.title

        for code, translation in list(existing.items()):
            if code not in incoming_codes:
                message.translations.remove(translation)
                db.delete(translation)

    try:
        db.commit()
    except IntegrityError as exc:  # pragma: no cover - defensive guard
        db.rollback()
        raise MessageConflictError("Message with same key or code already exists") from exc

    db.refresh(message)
    db.refresh(message, attribute_names=["translations"])
    return message


def delete_message(db: Session, message: BusinessMessage) -> None:
    """Delete a business message."""

    db.delete(message)
    db.commit()

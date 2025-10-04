"""Message CRUD API routes."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.business_message import BusinessMessage
from app.schemas import (
    BusinessMessageCreate,
    BusinessMessageRead,
    BusinessMessageUpdate,
    MessageTranslationRead,
)
from app.services import (
    MessageConflictError,
    create_message,
    delete_message,
    get_message,
    list_messages,
    update_message,
)

router = APIRouter()


def _serialise_message(message: BusinessMessage, language: str | None) -> BusinessMessageRead:
    """Convert a ``BusinessMessage`` ORM instance into the API schema."""

    normalized = language.lower() if language else None
    translations = list(message.translations or [])
    selected = None
    if normalized:
        for translation in translations:
            if translation.language_code.lower() == normalized:
                selected = translation
                break
    if selected is None and translations:
        selected = translations[0]

    return BusinessMessageRead(
        id=message.id,
        message_key=message.message_key,
        code=message.code,
        title=selected.title if selected else "",
        selected_language=selected.language_code if selected else None,
        translations=[
            MessageTranslationRead(
                language_code=translation.language_code,
                title=translation.title,
            )
            for translation in translations
        ],
        available_languages=[translation.language_code for translation in translations],
    )


@router.get("/", response_model=List[BusinessMessageRead])
def read_messages(
    message_key: str | None = Query(None, max_length=255),
    code: str | None = Query(None, max_length=32),
    db: Session = Depends(get_db),
) -> List[BusinessMessageRead]:
    """Return all stored business messages."""
    import logging
    logger = logging.getLogger("uvicorn")
    logger.info("Endpoint acessado: GET /messages/")

    messages = list_messages(db, message_key=message_key, code=code)
    logger.info(
        "Número de mensagens retornadas: %s", len(messages)
    )
    return [_serialise_message(message, None) for message in messages]


@router.post(
    "/",
    response_model=BusinessMessageRead,
    status_code=status.HTTP_201_CREATED,
)
def create_message_endpoint(
    message_in: BusinessMessageCreate,
    language: str | None = Query(None, max_length=16),
    db: Session = Depends(get_db),
) -> BusinessMessageRead:
    """Persist a new business message."""

    try:
        created = create_message(db, message_in)
        return _serialise_message(created, language)
    except MessageConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get("/{message_id}", response_model=BusinessMessageRead)
def read_message(
    message_id: str,
    language: str | None = Query(None, max_length=16),
    db: Session = Depends(get_db),
) -> BusinessMessageRead:
    """Return a single business message by identifier."""

    message = get_message(db, message_id)
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return _serialise_message(message, language)


@router.put("/{message_id}", response_model=BusinessMessageRead)
def update_message_endpoint(
    message_id: str,
    message_in: BusinessMessageUpdate,
    language: str | None = Query(None, max_length=16),
    db: Session = Depends(get_db),
) -> BusinessMessageRead:
    """Update an existing business message."""

    message = get_message(db, message_id)
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    try:
        updated = update_message(db, message, message_in)
        return _serialise_message(updated, language)
    except MessageConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message_endpoint(
    message_id: str,
    db: Session = Depends(get_db),
) -> Response:
    """Delete a business message."""

    message = get_message(db, message_id)
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    delete_message(db, message)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

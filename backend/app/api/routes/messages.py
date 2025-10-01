"""Message CRUD API routes."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas import BusinessMessageCreate, BusinessMessageRead, BusinessMessageUpdate
from app.services import (
    MessageConflictError,
    create_message,
    delete_message,
    get_message,
    list_messages,
    update_message,
)

router = APIRouter()


@router.get("/", response_model=List[BusinessMessageRead])
def read_messages(db: Session = Depends(get_db)) -> List[BusinessMessageRead]:
    """Return all stored business messages."""

    return list_messages(db)


@router.post(
    "/",
    response_model=BusinessMessageRead,
    status_code=status.HTTP_201_CREATED,
)
def create_message_endpoint(
    message_in: BusinessMessageCreate,
    db: Session = Depends(get_db),
) -> BusinessMessageRead:
    """Persist a new business message."""

    try:
        return create_message(db, message_in)
    except MessageConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get("/{message_id}", response_model=BusinessMessageRead)
def read_message(
    message_id: str,
    db: Session = Depends(get_db),
) -> BusinessMessageRead:
    """Return a single business message by identifier."""

    message = get_message(db, message_id)
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return message


@router.put("/{message_id}", response_model=BusinessMessageRead)
def update_message_endpoint(
    message_id: str,
    message_in: BusinessMessageUpdate,
    db: Session = Depends(get_db),
) -> BusinessMessageRead:
    """Update an existing business message."""

    message = get_message(db, message_id)
    if not message:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    try:
        return update_message(db, message, message_in)
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

"""Pydantic models describing business messages and history records."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class MessageHistoryBase(BaseModel):
    """Shared attributes for message history records."""

    version: int
    updated_at: datetime
    updated_by: str
    changes: str


class MessageHistoryCreate(MessageHistoryBase):
    """Schema for creating a new history entry."""

    message_id: str


class MessageHistoryRead(MessageHistoryBase):
    """Schema returned when reading history entries."""

    id: int
    message_id: str

    model_config = {"from_attributes": True}


class BusinessMessageBase(BaseModel):
    """Fields shared by all business message schemas."""

    message_key: str
    variables: List[str] = Field(default_factory=list)
    http_status: Optional[int] = None
    updated_by: str


class BusinessMessageCreate(BusinessMessageBase):
    """Schema for creating a new business message."""

    id: Optional[str] = None
    version: int = 1
    translations: List["MessageTranslationCreate"] = Field(default_factory=list)


class BusinessMessageUpdate(BaseModel):
    """Schema for updating an existing business message."""

    message_key: Optional[str] = None
    variables: Optional[List[str]] = None
    http_status: Optional[int] = None
    updated_by: Optional[str] = None
    translations: Optional[List["MessageTranslationCreate"]] = None


class MessageTranslationBase(BaseModel):
    """Shared attributes for message translations.

    Only the language ``code`` is accepted from clients. Names are managed
    internally and exposed only in read models.
    """

    language_code: str = Field(..., min_length=2, max_length=16)
    title: str
    body: str


class MessageTranslationCreate(MessageTranslationBase):
    """Schema used when creating or updating translations."""


class MessageTranslationRead(MessageTranslationBase):
    """Translation payload returned to API consumers."""


class BusinessMessageRead(BusinessMessageBase):
    """Schema returned when reading business messages."""

    id: str
    version: int
    created_at: datetime
    updated_at: datetime
    title: str
    body: str
    selected_language: Optional[str] = None
    translations: List[MessageTranslationRead] = Field(default_factory=list)
    available_languages: List[str] = Field(default_factory=list)
    history: List[MessageHistoryRead] = Field(default_factory=list)

    model_config = {"from_attributes": True}

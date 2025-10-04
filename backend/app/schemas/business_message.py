"""Pydantic models describing business messages."""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class BusinessMessageBase(BaseModel):
    """Fields shared by all business message schemas."""

    message_key: str
    code: str


class BusinessMessageCreate(BusinessMessageBase):
    """Schema for creating a new business message."""

    id: Optional[str] = None
    translations: List["MessageTranslationCreate"] = Field(default_factory=list)


class BusinessMessageUpdate(BaseModel):
    """Schema for updating an existing business message."""

    message_key: Optional[str] = None
    code: Optional[str] = None
    translations: Optional[List["MessageTranslationCreate"]] = None


class MessageTranslationBase(BaseModel):
    """Shared attributes for message translations."""

    language_code: str = Field(..., min_length=2, max_length=16)
    title: str


class MessageTranslationCreate(MessageTranslationBase):
    """Schema used when creating or updating translations."""


class MessageTranslationRead(MessageTranslationBase):
    """Translation payload returned to API consumers."""


class BusinessMessageRead(BusinessMessageBase):
    """Schema returned when reading business messages."""

    id: str
    title: str
    selected_language: Optional[str] = None
    translations: List[MessageTranslationRead] = Field(default_factory=list)
    available_languages: List[str] = Field(default_factory=list)

    model_config = {"from_attributes": True}

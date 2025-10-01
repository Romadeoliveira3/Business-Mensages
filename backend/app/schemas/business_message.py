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
    title: str
    body: str
    variables: List[str] = Field(default_factory=list)
    http_status: Optional[int] = None
    updated_by: str


class BusinessMessageCreate(BusinessMessageBase):
    """Schema for creating a new business message."""

    id: Optional[str] = None
    version: int = 1


class BusinessMessageUpdate(BaseModel):
    """Schema for updating an existing business message."""

    message_key: Optional[str] = None
    title: Optional[str] = None
    body: Optional[str] = None
    variables: Optional[List[str]] = None
    http_status: Optional[int] = None
    updated_by: Optional[str] = None


class BusinessMessageRead(BusinessMessageBase):
    """Schema returned when reading business messages."""

    id: str
    version: int
    created_at: datetime
    updated_at: datetime
    history: List[MessageHistoryRead] = Field(default_factory=list)

    model_config = {"from_attributes": True}

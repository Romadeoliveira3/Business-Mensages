"""Base metadata for SQLAlchemy models."""

from app.db.base_class import Base
from app.models import BusinessMessage

__all__ = ["Base", "BusinessMessage"]

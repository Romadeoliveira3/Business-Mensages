"""SQLAlchemy base metadata import placeholder."""

from app.db.base_class import Base
from app.models import BusinessMessage, MessageHistory

__all__ = ["Base", "BusinessMessage", "MessageHistory"]

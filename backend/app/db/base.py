"""SQLAlchemy base metadata import placeholder.

Import all SQLAlchemy models here so that Alembic can detect them for
migrations. This module intentionally remains minimal until real models are
introduced.
"""

from app.db.base_class import Base

__all__ = ["Base"]

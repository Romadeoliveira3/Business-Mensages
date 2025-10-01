"""Utilities for managing database migrations programmatically."""

from __future__ import annotations

import logging
from pathlib import Path

from alembic import command
from alembic.config import Config

from app.core.config import settings

LOGGER = logging.getLogger(__name__)


def _get_alembic_config() -> Config:
    """Return an Alembic ``Config`` object bound to the current settings."""

    base_dir = Path(__file__).resolve().parents[2]
    alembic_ini = base_dir / "alembic.ini"

    config = Config(str(alembic_ini))
    config.set_main_option("sqlalchemy.url", settings.sqlalchemy_database_uri)
    config.attributes.setdefault("configure_logger", False)
    return config


def run_migrations() -> None:
    """Apply all pending Alembic migrations."""

    config = _get_alembic_config()
    LOGGER.info("Running database migrations")
    command.upgrade(config, "head")
    LOGGER.info("Database migrations complete")

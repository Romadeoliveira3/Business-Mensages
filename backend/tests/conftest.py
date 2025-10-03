"""Shared pytest fixtures for the backend test suite."""

from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path
from typing import Callable, Iterator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.db.base import Base  # noqa: E402
from app.models.business_message import (  # noqa: E402
    BusinessMessage,
    Language,
    MessageTranslation,
)

SessionFactory = Callable[[], Session]


@pytest.fixture()
def session_factory() -> Iterator[SessionFactory]:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    factory: SessionFactory = sessionmaker(bind=engine)
    try:
        yield factory
    finally:
        engine.dispose()


def create_message(
    session: Session,
    *,
    key: str,
    version: int,
    body: str,
    variables: list[str] | None = None,
    http_status: int | None = None,
    language_code: str = "en",
    language_name: str | None = None,
) -> None:
    """Persist a ``BusinessMessage`` row for testing purposes."""

    now = datetime.utcnow()
    language = session.get(Language, language_code)
    if language is None:
        language = Language(code=language_code, name=language_name or language_code)
        session.add(language)
        session.flush()

    session.add(
        BusinessMessage(
            id=f"{key}-{version}",
            message_key=key,
            version=version,
            variables=variables or [],
            http_status=http_status,
            created_at=now,
            updated_at=now,
            updated_by="tester",
            translations=[
                MessageTranslation(
                    message_id=f"{key}-{version}",
                    language_code=language.code,
                    title=f"Title {version}",
                    body=body,
                )
            ],
        )
    )

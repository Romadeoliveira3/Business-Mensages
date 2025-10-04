from __future__ import annotations

import sys
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
    code: str,
    title: str | None = None,
    language_code: str = "en",
) -> None:
    """Persist a ``BusinessMessage`` row for testing purposes."""

    language = session.get(Language, language_code)
    if language is None:
        language = Language(code=language_code)
        session.add(language)
        session.flush()

    message_id = code
    message = BusinessMessage(
        id=message_id,
        message_key=key,
        code=code,
        translations=[
            MessageTranslation(
                message_id=message_id,
                language_code=language.code,
                title=title or f"Title {code}",
            )
        ],
    )
    session.add(message)

from __future__ import annotations

from collections.abc import Callable, Iterator
from datetime import datetime
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.lib import (
    MessageCatalog,
    MessageNotFoundError,
    MissingMessageVariablesError,
)
from app.models.business_message import BusinessMessage

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


def _create_message(
    session: Session,
    *,
    key: str,
    version: int,
    body: str,
    variables: list[str] | None = None,
    http_status: int | None = None,
) -> None:
    now = datetime.utcnow()
    session.add(
        BusinessMessage(
            id=f"{key}-{version}",
            message_key=key,
            version=version,
            title=f"Title {version}",
            body=body,
            variables=variables or [],
            http_status=http_status,
            created_at=now,
            updated_at=now,
            updated_by="tester",
        )
    )


def test_get_latest_version(session_factory: SessionFactory) -> None:
    catalog = MessageCatalog(session_factory=session_factory, enable_cache=False)
    with session_factory() as session:
        _create_message(session, key="payment_failed", version=1, body="Payment failed {user}")
        _create_message(
            session,
            key="payment_failed",
            version=2,
            body="Payment failed {user} ({reason})",
            variables=["user", "reason"],
            http_status=422,
        )
        session.commit()

    template = catalog.get("payment_failed")
    assert template.version == 2
    rendered = template.render(user="Ana", reason="card_declined")
    assert rendered == "Payment failed Ana (card_declined)"


def test_get_specific_version(session_factory: SessionFactory) -> None:
    catalog = MessageCatalog(session_factory=session_factory, enable_cache=True)
    with session_factory() as session:
        _create_message(session, key="welcome", version=1, body="Hello {user}")
        _create_message(session, key="welcome", version=2, body="Welcome {user}")
        session.commit()

    first_version = catalog.get("welcome", version=1)
    assert first_version.version == 1
    assert first_version.render(user="João") == "Hello João"

    # Cache should return the same instance until invalidated
    cached = catalog.get("welcome", version=1)
    assert cached is first_version
    catalog.invalidate("welcome", version=1)
    refreshed = catalog.get("welcome", version=1)
    assert refreshed is not first_version


def test_missing_variables_raise(session_factory: SessionFactory) -> None:
    catalog = MessageCatalog(session_factory=session_factory)
    with session_factory() as session:
        _create_message(session, key="error", version=1, body="Error for {user}", variables=["user"])
        session.commit()

    with pytest.raises(MissingMessageVariablesError):
        catalog.get("error").render()


def test_format_error_payload(session_factory: SessionFactory) -> None:
    catalog = MessageCatalog(session_factory=session_factory)
    with session_factory() as session:
        _create_message(
            session,
            key="not_found",
            version=1,
            body="Resource {resource_id} not found",
            variables=["resource_id"],
            http_status=404,
        )
        session.commit()

    status, payload = catalog.format_error("not_found", values={"resource_id": "123"})
    assert status == 404
    assert payload["body"] == "Resource 123 not found"
    assert payload["message_key"] == "not_found"


def test_message_not_found(session_factory: SessionFactory) -> None:
    catalog = MessageCatalog(session_factory=session_factory)
    with pytest.raises(MessageNotFoundError):
        catalog.get("missing")

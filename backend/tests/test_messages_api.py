from __future__ import annotations

from typing import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.main import app
from tests.conftest import SessionFactory


@pytest.fixture()
def api_client(session_factory: SessionFactory) -> Iterator[TestClient]:
    def _get_session() -> Iterator[Session]:
        with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = _get_session
    client = TestClient(app)
    try:
        yield client
    finally:
        app.dependency_overrides.pop(get_db, None)
        client.close()


def test_create_message_with_invalid_language_returns_422(api_client: TestClient) -> None:
    response = api_client.post(
        "/messages/",
        json={
            "message_key": "example",
            "code": "EX-001",
            "translations": [
                {"language_code": "string", "title": "Hello"},
            ],
        },
    )

    assert response.status_code == 422
    payload = response.json()
    assert payload["detail"].startswith("Unsupported language code")

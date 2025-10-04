"""Tests for the public ``bm`` helper package."""
from __future__ import annotations

import bm
import bm.client as client_module
import pytest

from bm import BusinessMessages
from app.models.business_message import Language, MessageTranslation
from tests.conftest import SessionFactory, create_message


def test_business_messages_behaves_like_mapping(session_factory: SessionFactory) -> None:
    client = BusinessMessages(session_factory=session_factory)
    with session_factory() as session:
        create_message(session, key="invoice", version=1, body="Invoice {id}", variables=["id"])
        session.commit()

    template = client.get("invoice")
    assert template.render(id="42") == "Invoice 42"

    # ``__call__`` and ``__getitem__`` should reuse the cached template instance
    assert client("invoice") is template
    assert client["invoice"] is template


def test_problem_payload_shape(session_factory: SessionFactory) -> None:
    client = BusinessMessages(session_factory=session_factory)
    with session_factory() as session:
        create_message(
            session,
            key="not_allowed",
            version=1,
            body="Not allowed for {user}",
            variables=["user"],
            http_status=403,
        )
        session.commit()

    problem = client.problem("not_allowed", values={"user": "Ana"})
    assert problem["status"] == 403
    assert problem["payload"]["body"] == "Not allowed for Ana"
    assert problem["payload"]["variables"] == ["user"]


def test_module_shortcuts_delegate_to_default(
    session_factory: SessionFactory, monkeypatch: pytest.MonkeyPatch
) -> None:
    custom = BusinessMessages(session_factory=session_factory)
    monkeypatch.setattr(client_module, "bm", custom)
    monkeypatch.setattr(bm, "bm", custom)

    with session_factory() as session:
        create_message(session, key="greeting", version=1, body="Hi {name}", variables=["name"])
        session.commit()

    template = bm.get("greeting")
    assert template.render(name="Ana") == "Hi Ana"

    rendered = bm.payload("greeting", values={"name": "Ana"})
    assert rendered["body"] == "Hi Ana"

    problem = bm.problem("greeting", values={"name": "Ana"})
    assert problem["status"] == 400
    assert problem["payload"]["body"] == "Hi Ana"


def test_language_selection(session_factory: SessionFactory) -> None:
    client = BusinessMessages(session_factory=session_factory, enable_cache=False)
    with session_factory() as session:
        create_message(session, key="hello", version=1, body="Hello {name}")
        session.commit()

        session.add(Language(code="pt-BR"))
        session.add(
            MessageTranslation(
                message_id="hello-1",
                language_code="pt-BR",
                title="Saudação",
                body="Olá {name}",
            )
        )
        session.commit()

    template = client.get("hello", language="pt-BR")
    assert template.language == "pt-BR"
    assert template.render(name="Ana") == "Olá Ana"

    payload = client.payload("hello", values={"name": "Ana"}, language="pt-BR")
    assert payload["body"] == "Olá Ana"

import bm
import bm.client as client_module
import pytest

from bm import BusinessMessages
from app.models.business_message import Language, MessageTranslation
from tests.conftest import SessionFactory, create_message


def test_business_messages_behaves_like_mapping(session_factory: SessionFactory) -> None:
    client = BusinessMessages(session_factory=session_factory)
    with session_factory() as session:
        create_message(
            session,
            key="invoice",
            code="MSG-INV",
            title="Invoice {id}",
        )
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
            code="MSG-NA",
            title="Not allowed for {user}",
        )
        session.commit()

    problem = client.problem("not_allowed", values={"user": "Ana"})
    assert problem["status"] == 400
    assert problem["payload"]["title"] == "Not allowed for Ana"
    assert problem["payload"]["code"] == "MSG-NA"


def test_module_shortcuts_delegate_to_default(
    session_factory: SessionFactory, monkeypatch: pytest.MonkeyPatch
) -> None:
    custom = BusinessMessages(session_factory=session_factory)
    monkeypatch.setattr(client_module, "bm", custom)
    monkeypatch.setattr(bm, "bm", custom)

    with session_factory() as session:
        create_message(
            session,
            key="greeting",
            code="MSG-GREET",
            title="Hi {name}",
        )
        session.commit()

    template = bm.get("greeting")
    assert template.render(name="Ana") == "Hi Ana"

    rendered = bm.payload("greeting", values={"name": "Ana"})
    assert rendered["title"] == "Hi Ana"

    problem = bm.problem("greeting", values={"name": "Ana"})
    assert problem["status"] == 400
    assert problem["payload"]["title"] == "Hi Ana"


def test_language_selection(session_factory: SessionFactory) -> None:
    client = BusinessMessages(session_factory=session_factory, enable_cache=False)
    with session_factory() as session:
        create_message(
            session,
            key="hello",
            code="MSG-HELLO",
            title="Hello {name}",
        )
        session.commit()

        session.add(Language(code="pt-BR"))
        session.add(
            MessageTranslation(
                message_id="MSG-HELLO",
                language_code="pt-BR",
                title="Olá {name}",
            )
        )
        session.commit()

    template = client.get("hello", language="pt-BR")
    assert template.language == "pt-BR"
    assert template.render(name="Ana") == "Olá Ana"

    payload = client.payload("hello", values={"name": "Ana"}, language="pt-BR")
    assert payload["title"] == "Olá Ana"

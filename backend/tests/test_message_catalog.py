import pytest

from bm import MessageCatalog, MessageNotFoundError, MissingMessageVariablesError
from app.models.business_message import Language, MessageTranslation
from tests.conftest import SessionFactory, create_message


def test_get_message(session_factory: SessionFactory) -> None:
    catalog = MessageCatalog(session_factory=session_factory, enable_cache=False)
    with session_factory() as session:
        create_message(
            session,
            key="payment_failed",
            code="ERR-001",
            title="Payment failed {user}",
        )
        session.commit()

    template = catalog.get("payment_failed")
    assert template.code == "ERR-001"
    assert template.render(user="Ana") == "Payment failed Ana"


def test_missing_variables_raise(session_factory: SessionFactory) -> None:
    catalog = MessageCatalog(session_factory=session_factory)
    with session_factory() as session:
        create_message(
            session,
            key="error",
            code="ERR-002",
            title="Error for {user}",
        )
        session.commit()

    with pytest.raises(MissingMessageVariablesError):
        catalog.get("error").render()


def test_format_error_payload(session_factory: SessionFactory) -> None:
    catalog = MessageCatalog(session_factory=session_factory)
    with session_factory() as session:
        create_message(
            session,
            key="not_found",
            code="ERR-404",
            title="Resource {resource_id} not found",
        )
        session.commit()

    status, payload = catalog.format_error("not_found", values={"resource_id": "123"})
    assert status == 400
    assert payload["title"] == "Resource 123 not found"
    assert payload["code"] == "ERR-404"
    assert payload["message_key"] == "not_found"


def test_message_not_found(session_factory: SessionFactory) -> None:
    catalog = MessageCatalog(session_factory=session_factory)
    with pytest.raises(MessageNotFoundError):
        catalog.get("missing")


def test_language_specific_translation(session_factory: SessionFactory) -> None:
    catalog = MessageCatalog(session_factory=session_factory, enable_cache=False)
    with session_factory() as session:
        create_message(
            session,
            key="welcome",
            code="MSG-001",
            title="Hello {user}",
        )
        session.commit()

        session.add(Language(code="pt-BR"))
        session.add(
            MessageTranslation(
                message_id="MSG-001",
                language_code="pt-BR",
                title="Olá {user}",
            )
        )
        session.commit()

    localized = catalog.get("welcome", language="pt-BR")
    assert localized.language == "pt-BR"
    assert localized.render(user="João") == "Olá João"

    fallback = catalog.get("welcome", language="es")
    assert fallback.language != "es"
    assert fallback.render(user="João") == "Hello João"

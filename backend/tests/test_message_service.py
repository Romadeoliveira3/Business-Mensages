from __future__ import annotations

from app.services.message_service import list_messages
from tests.conftest import SessionFactory, create_message


def test_list_messages_filters(session_factory: SessionFactory) -> None:
    with session_factory() as session:
        create_message(
            session,
            key="welcome",
            code="MSG-WELCOME",
            title="Welcome",
        )
        create_message(
            session,
            key="farewell",
            code="MSG-FAREWELL",
            title="Farewell",
        )
        session.commit()

        all_messages = list_messages(session)
        assert {message.message_key for message in all_messages} == {"welcome", "farewell"}

        filtered_by_key = list_messages(session, message_key="welcome")
        assert [message.message_key for message in filtered_by_key] == ["welcome"]

        filtered_by_code = list_messages(session, code="MSG-FAREWELL")
        assert [message.code for message in filtered_by_code] == ["MSG-FAREWELL"]

        assert list_messages(session, message_key="missing") == []

"""Utility helpers for retrieving and rendering business messages by key."""

from __future__ import annotations

"""Utility helpers to query business messages by key and format their content."""

from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Callable, Dict, Iterable, Iterator, Mapping, Tuple

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.business_message import BusinessMessage

SessionFactory = Callable[[], Session]


class MessageCatalogError(RuntimeError):
    """Base error raised by the message catalog utilities."""


class MessageNotFoundError(MessageCatalogError):
    """Raised when a message cannot be located for a given key/version."""

    def __init__(self, message_key: str, version: int | None = None) -> None:
        detail = f" (version={version})" if version is not None else ""
        super().__init__(f"No message registered with key '{message_key}'{detail}")
        self.message_key = message_key
        self.version = version


class MissingMessageVariablesError(MessageCatalogError):
    """Raised when the consumer does not provide all variables for rendering."""

    def __init__(self, missing: Iterable[str], message_key: str) -> None:
        missing_list = sorted(set(missing))
        formatted = ", ".join(missing_list)
        super().__init__(
            f"Missing values for variables [{formatted}] when rendering message '{message_key}'"
        )
        self.missing = tuple(missing_list)
        self.message_key = message_key


@dataclass(frozen=True, slots=True)
class MessageTemplate:
    """Immutable representation of a message fetched from the database."""

    id: str
    key: str
    title: str
    body: str
    variables: Tuple[str, ...]
    version: int
    updated_by: str
    created_at: datetime
    updated_at: datetime
    http_status: int | None = None

    def _render(self, values: Mapping[str, Any]) -> str:
        missing = [name for name in self.variables if name not in values]
        if missing:
            raise MissingMessageVariablesError(missing, self.key)

        try:
            return self.body.format(**values)
        except KeyError as exc:  # pragma: no cover - defensive
            raise MissingMessageVariablesError([str(exc)], self.key) from exc

    def render(self, **values: Any) -> str:
        """Return the body formatted with the provided keyword arguments."""

        return self._render(values)

    def render_with(self, values: Mapping[str, Any]) -> str:
        """Return the body formatted with a mapping of values."""

        return self._render(values)

    def to_payload(
        self,
        values: Mapping[str, Any] | None = None,
        *,
        include_http_status: bool = True,
        include_variables: bool = True,
    ) -> Dict[str, Any]:
        """Return a serialisable payload with rendered content and metadata."""

        payload: Dict[str, Any] = {
            "message_key": self.key,
            "title": self.title,
            "body": self.body if values is None else self.render_with(values),
            "version": self.version,
        }
        if include_variables:
            payload["variables"] = list(self.variables)
        if include_http_status and self.http_status is not None:
            payload["http_status"] = self.http_status
        return payload


class MessageCatalog:
    """Helper responsible for fetching message templates by key/version."""

    def __init__(
        self,
        session_factory: SessionFactory | None = None,
        *,
        enable_cache: bool = True,
    ) -> None:
        self._session_factory = session_factory or SessionLocal
        self._enable_cache = enable_cache
        self._cache: Dict[tuple[str, int | None], MessageTemplate] = {}

    @contextmanager
    def _session_scope(self) -> Iterator[Session]:
        session = self._session_factory()
        try:
            yield session
        finally:
            session.close()

    def _materialise(self, message: BusinessMessage) -> MessageTemplate:
        return MessageTemplate(
            id=message.id,
            key=message.message_key,
            title=message.title,
            body=message.body,
            variables=tuple(message.variables or ()),
            version=message.version,
            updated_by=message.updated_by,
            created_at=message.created_at,
            updated_at=message.updated_at,
            http_status=message.http_status,
        )

    def _fetch(
        self, session: Session, message_key: str, version: int | None
    ) -> MessageTemplate:
        stmt = select(BusinessMessage).where(BusinessMessage.message_key == message_key)
        if version is not None:
            stmt = stmt.where(BusinessMessage.version == version)
        else:
            stmt = stmt.order_by(BusinessMessage.version.desc())

        message = session.scalars(stmt).first()
        if message is None:
            raise MessageNotFoundError(message_key, version)
        return self._materialise(message)

    def get(
        self,
        message_key: str,
        *,
        version: int | None = None,
        refresh: bool = False,
    ) -> MessageTemplate:
        """Retrieve a message template by key, optionally a specific version."""

        cache_key = (message_key, version)
        if self._enable_cache and not refresh:
            cached = self._cache.get(cache_key)
            if cached is not None:
                return cached

        with self._session_scope() as session:
            template = self._fetch(session, message_key, version)

        if self._enable_cache:
            self._cache[cache_key] = template
        return template

    def invalidate(self, message_key: str, version: int | None = None) -> None:
        """Remove a cached template for the provided key/version."""

        self._cache.pop((message_key, version), None)

    def clear(self) -> None:
        """Clear the in-memory cache of templates."""

        self._cache.clear()

    def format_error(
        self,
        message_key: str,
        values: Mapping[str, Any] | None = None,
        *,
        version: int | None = None,
        default_status: int = 400,
        include_http_status: bool = True,
    ) -> tuple[int, Dict[str, Any]]:
        """Return an HTTP-style status code and payload for an error message."""

        template = self.get(message_key, version=version)
        payload = template.to_payload(values, include_http_status=include_http_status)
        status_code = template.http_status if template.http_status is not None else default_status
        return status_code, payload


_default_catalog = MessageCatalog()


def get_message(
    message_key: str,
    *,
    version: int | None = None,
    refresh: bool = False,
) -> MessageTemplate:
    """Retrieve a message using the default catalog instance."""

    return _default_catalog.get(message_key, version=version, refresh=refresh)


def format_error(
    message_key: str,
    values: Mapping[str, Any] | None = None,
    *,
    version: int | None = None,
    default_status: int = 400,
    include_http_status: bool = True,
) -> tuple[int, Dict[str, Any]]:
    """Convenience wrapper around :meth:`MessageCatalog.format_error`."""

    return _default_catalog.format_error(
        message_key,
        values,
        version=version,
        default_status=default_status,
        include_http_status=include_http_status,
    )


__all__ = [
    "MessageCatalog",
    "MessageCatalogError",
    "MessageNotFoundError",
    "MessageTemplate",
    "MissingMessageVariablesError",
    "format_error",
    "get_message",
]

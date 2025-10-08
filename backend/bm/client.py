"""User-facing helpers for accessing and formatting business messages."""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from string import Formatter
from typing import Any, Callable, Dict, Iterable, Iterator, Mapping

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db.session import SessionLocal
from app.models.business_message import BusinessMessage, MessageTranslation

SessionFactory = Callable[[], Session]


class MessageCatalogError(RuntimeError):
    """Base error raised by the message catalog utilities."""


class MessageNotFoundError(MessageCatalogError):
    """Raised when a message cannot be located for a given key."""

    def __init__(self, message_key: str) -> None:
        super().__init__(f"No message registered with key '{message_key}'")
        self.message_key = message_key


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


def _extract_placeholders(text: str) -> tuple[str, ...]:
    formatter = Formatter()
    placeholders = {
        field
        for _literal, field, _format, _conversion in formatter.parse(text)
        if field
    }
    return tuple(sorted(placeholders))


@dataclass(frozen=True, slots=True)
class MessageTemplate:
    """Immutable representation of a message fetched from the database."""

    id: str
    key: str
    code: str
    title: str
    language: str
    placeholders: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        object.__setattr__(self, "placeholders", _extract_placeholders(self.title))

    def render(
        self,
        *,
        values: Mapping[str, Any] | None = None,
        **kwargs: Any,
    ) -> str:
        """Return the title formatted with mapping values or keyword arguments."""

        if values is not None and kwargs:
            raise TypeError("Pass either 'values' mapping or keyword arguments, not both")

        data: Mapping[str, Any]
        if values is not None:
            data = values
        else:
            data = kwargs

        if not data:
            if self.placeholders:
                raise MissingMessageVariablesError(self.placeholders, self.key)
            return self.title

        missing = [name for name in self.placeholders if name not in data]
        if missing:
            raise MissingMessageVariablesError(missing, self.key)

        try:
            return self.title.format(**data)
        except KeyError as exc:  # pragma: no cover - defensive
            raise MissingMessageVariablesError([str(exc)], self.key) from exc

    def to_payload(
        self,
        values: Mapping[str, Any] | None = None,
    ) -> Dict[str, Any]:
        """Return a serialisable payload with rendered content and metadata."""

        payload: Dict[str, Any] = {
            "message_key": self.key,
            "code": self.code,
            "title": self.title if values is None else self.render(values=values),
        }
        payload["language"] = self.language
        return payload


class MessageCatalog:
    """Helper responsible for fetching message templates by key."""

    def __init__(
        self,
        session_factory: SessionFactory | None = None,
        *,
        enable_cache: bool = True,
        default_language: str | None = "pt-BR",
    ) -> None:
        self._session_factory = session_factory or SessionLocal
        self._enable_cache = enable_cache
        self._default_language = default_language.lower() if default_language else None
        self._cache: Dict[tuple[str, str | None], MessageTemplate] = {}

    @contextmanager
    def _session_scope(self) -> Iterator[Session]:
        session = self._session_factory()
        try:
            yield session
        finally:
            session.close()

    def _materialise(
        self, message: BusinessMessage, language: str | None
    ) -> MessageTemplate:
        translations = list(message.translations or [])
        selected: MessageTranslation | None = None
        normalized = language.lower() if language else None
        if normalized:
            for translation in translations:
                if translation.language_code.lower() == normalized:
                    selected = translation
                    break
        if selected is None and translations:
            selected = translations[0]
        if selected is None:
            raise MessageCatalogError(
                f"Message '{message.message_key}' does not have any registered translations"
            )

        return MessageTemplate(
            id=message.id,
            key=message.message_key,
            code=message.code,
            title=selected.title,
            language=selected.language_code,
        )

    def _fetch(
        self,
        session: Session,
        message_key: str,
        language: str | None,
    ) -> MessageTemplate:
        stmt = (
            select(BusinessMessage)
            .options(joinedload(BusinessMessage.translations))
            .where(BusinessMessage.message_key == message_key)
        )

        message = session.scalars(stmt).first()
        if message is None:
            raise MessageNotFoundError(message_key)
        return self._materialise(message, language)

    def get(
        self,
        message_key: str,
        *,
        language: str | None = None,
        refresh: bool = False,
    ) -> MessageTemplate:
        """Retrieve a message template by key."""

        effective_language = language.lower() if language else self._default_language
        cache_key = (message_key, effective_language)
        if self._enable_cache and not refresh:
            cached = self._cache.get(cache_key)
            if cached is not None:
                return cached

        with self._session_scope() as session:
            template = self._fetch(session, message_key, effective_language)

        if self._enable_cache:
            self._cache[cache_key] = template
        return template

    def invalidate(
        self,
        message_key: str,
        *,
        language: str | None = None,
    ) -> None:
        """Remove a cached template for the provided key."""

        normalized = language.lower() if language else None
        keys_to_remove = [
            cache_key
            for cache_key in list(self._cache)
            if cache_key[0] == message_key
            and (normalized is None or cache_key[1] == normalized)
        ]
        for cache_key in keys_to_remove:
            self._cache.pop(cache_key, None)

    def clear(self) -> None:
        """Clear the whole in-memory cache of templates."""

        self._cache.clear()

    def format_error(
        self,
        message_key: str,
        *,
        values: Mapping[str, Any] | None = None,
        language: str | None = None,
        default_status: int = 400,
    ) -> tuple[int, Dict[str, Any]]:
        """Return a pair ``(status, payload)`` for the requested message."""

        template = self.get(message_key, language=language)
        payload = template.to_payload(values)
        return default_status, payload

# Please keep __all__ alphabetical.
__all__ = [
    "BusinessMessages",
    "MessageCatalog",
    "MessageCatalogError",
    "MessageNotFoundError",
    "MessageTemplate",
    "MissingMessageVariablesError",
    "bm",
    "create",
]


class BusinessMessages:
    """User facing helper that encapsulates message lookup and rendering."""

    def __init__(
        self,
        session_factory: SessionFactory | None = None,
        *,
        enable_cache: bool = True,
        default_language: str | None = "pt-BR",
    ) -> None:
        self._catalog = MessageCatalog(
            session_factory,
            enable_cache=enable_cache,
            default_language=default_language,
        )

    # ------------------------------------------------------------------
    # Core access helpers
    # ------------------------------------------------------------------
    def get(
        self,
        key: str,
        *,
        language: str | None = None,
        refresh: bool = False,
    ) -> MessageTemplate:
        """Fetch a template by key with optional cache refresh."""

        return self._catalog.get(
            key,
            language=language,
            refresh=refresh,
        )

    def __call__(
        self,
        key: str,
        *,
        language: str | None = None,
        refresh: bool = False,
    ) -> MessageTemplate:
        """Alias for :meth:`get` so the instance can be called directly."""

        return self.get(key, language=language, refresh=refresh)

    def __getitem__(self, key: str) -> MessageTemplate:
        """Provide a mapping-like experience using ``bm["KEY"]`` syntax."""

        return self.get(key)

    # ------------------------------------------------------------------
    # Rendering helpers
    # ------------------------------------------------------------------
    def payload(
        self,
        key: str,
        values: Mapping[str, Any] | None = None,
        *,
        language: str | None = None,
        refresh: bool = False,
    ) -> Dict[str, Any]:
        """Return a serialisable payload ready to be sent to consumers."""

        template = self.get(key, language=language, refresh=refresh)
        return template.to_payload(values)

    def format_error(
        self,
        key: str,
        values: Mapping[str, Any] | None = None,
        *,
        language: str | None = None,
        default_status: int = 400,
        refresh: bool = False,
    ) -> tuple[int, Dict[str, Any]]:
        """Return ``(status, payload)`` using the configured catalog."""

        if refresh:
            self.invalidate(key, language=language)
        return self._catalog.format_error(
            key,
            values=values,
            language=language,
            default_status=default_status,
        )

    def problem(
        self,
        key: str,
        values: Mapping[str, Any] | None = None,
        *,
        language: str | None = None,
        default_status: int = 400,
        refresh: bool = False,
    ) -> Dict[str, Any]:
        """Generate a problem-details style dictionary with status and payload."""

        status, payload = self.format_error(
            key,
            values=values,
            language=language,
            default_status=default_status,
            refresh=refresh,
        )
        return {"status": status, "payload": payload}

    # ------------------------------------------------------------------
    # Cache helpers
    # ------------------------------------------------------------------
    def invalidate(
        self,
        key: str,
        *,
        language: str | None = None,
    ) -> None:
        """Remove a cached template for the provided key."""

        self._catalog.invalidate(key, language=language)

    def clear(self) -> None:
        """Clear the whole in-memory cache of templates."""

        self._catalog.clear()


bm: BusinessMessages = BusinessMessages()
bm.__doc__ = "A default :class:`BusinessMessages` instance backed by the global session."


def create(
    session_factory: SessionFactory | None = None,
    *,
    enable_cache: bool = True,
    default_language: str | None = None,
) -> BusinessMessages:
    """Return a configured :class:`BusinessMessages` instance."""

    return BusinessMessages(
        session_factory,
        enable_cache=enable_cache,
        default_language=default_language,
    )

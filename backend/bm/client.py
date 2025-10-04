"""User-facing helpers for accessing business messages."""

from __future__ import annotations

from typing import Any, Callable, Dict, Mapping

from sqlalchemy.orm import Session

from app.lib.message_catalog import (
    MessageCatalog,
    MessageCatalogError,
    MessageNotFoundError,
    MessageTemplate,
    MissingMessageVariablesError,
)

SessionFactory = Callable[[], Session]

# Please keep __all__ alphabetical.
__all__ = [
    "bm",
    "BusinessMessages",
    "create",
    "get",
    "MessageCatalogError",
    "MessageNotFoundError",
    "MessageTemplate",
    "MissingMessageVariablesError",
    "payload",
    "problem",
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

        template = self.get(key, language=language, refresh=refresh)
        payload = template.to_payload(values)
        return {"status": default_status, "payload": payload}

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


def get(
    key: str,
    *,
    language: str | None = None,
    refresh: bool = False,
) -> MessageTemplate:
    """Resolve a template using the module level :data:`bm` instance."""

    return bm.get(key, language=language, refresh=refresh)


def payload(
    key: str,
    values: Mapping[str, Any] | None = None,
    *,
    language: str | None = None,
    refresh: bool = False,
) -> Dict[str, Any]:
    """Shortcut for :meth:`BusinessMessages.payload`."""

    return bm.payload(key, values=values, language=language, refresh=refresh)


def problem(
    key: str,
    values: Mapping[str, Any] | None = None,
    *,
    language: str | None = None,
    default_status: int = 400,
    refresh: bool = False,
) -> Dict[str, Any]:
    """Shortcut for :meth:`BusinessMessages.problem`."""

    return bm.problem(
        key,
        values=values,
        language=language,
        default_status=default_status,
        refresh=refresh,
    )

"""High level client utilities for interacting with Business Messages.

The goal of this module is twofold:

* Provide the :class:`BusinessMessages` facade which behaves like a mix of a
  mapping and a callable, emulating the ergonomics popularised by FastAPI's
  declarative interfaces.
* Expose module level shortcuts—:data:`bm`, :func:`create`, :func:`get`,
  :func:`payload`, and :func:`problem`—that are immediately familiar to users
  of libraries such as :mod:`typing`, where the public surface is curated via
  :data:`__all__`.

The underlying implementation delegates to :class:`app.lib.message_catalog`
for data access while keeping a thin, well documented layer that can be used
directly by applications or other packages.
"""

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
    "get_key",
    "MessageCatalogError",
    "MessageNotFoundError",
    "MessageTemplate",
    "MissingMessageVariablesError",
    "payload",
    "problem",
]


class BusinessMessages:
    """User facing helper that encapsulates message lookup and rendering.

    The class intentionally mirrors the feel of FastAPI's dependency-injection
    driven objects: a single instance can be called directly, indexed like a
    mapping, or accessed through explicit methods. Internally it forwards calls
    to :class:`app.lib.message_catalog.MessageCatalog` while keeping the public
    surface small and expressive.
    """

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
        version: int | None = None,
        language: str | None = None,
        refresh: bool = False,
    ) -> MessageTemplate:
        """Fetch a template by key with optional versioning and cache refresh."""

        return self._catalog.get(
            key,
            version=version,
            language=language,
            refresh=refresh,
        )

    def __call__(
        self,
        key: str,
        *,
        version: int | None = None,
        language: str | None = None,
        refresh: bool = False,
    ) -> MessageTemplate:
        """Alias for :meth:`get` so the instance can be called directly."""

        return self.get(key, version=version, language=language, refresh=refresh)

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
        version: int | None = None,
        language: str | None = None,
        include_http_status: bool = True,
        include_variables: bool = True,
        refresh: bool = False,
    ) -> Dict[str, Any]:
        """Return a serialisable payload ready to be sent to consumers."""

        template = self.get(key, version=version, language=language, refresh=refresh)
        return template.to_payload(
            values,
            include_http_status=include_http_status,
            include_variables=include_variables,
        )

    def problem(
        self,
        key: str,
        values: Mapping[str, Any] | None = None,
        *,
        version: int | None = None,
        language: str | None = None,
        default_status: int = 400,
        include_http_status: bool = True,
        include_variables: bool = True,
        refresh: bool = False,
    ) -> Dict[str, Any]:
        """Generate a problem-details style dictionary with status and payload."""

        template = self.get(key, version=version, language=language, refresh=refresh)
        payload = template.to_payload(
            values,
            include_http_status=include_http_status,
            include_variables=include_variables,
        )
        status_code = template.http_status if template.http_status is not None else default_status
        return {"status": status_code, "payload": payload}

    # ------------------------------------------------------------------
    # Cache helpers
    # ------------------------------------------------------------------
    def invalidate(
        self,
        key: str,
        version: int | None = None,
        *,
        language: str | None = None,
    ) -> None:
        """Remove a cached template for the provided key and version."""

        self._catalog.invalidate(key, version, language=language)

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
    """Return a configured :class:`BusinessMessages` instance.

    Parameters
    ----------
    session_factory:
        Optional callable returning a :class:`sqlalchemy.orm.Session`. When not
        provided, the default session factory from the application is used.
    enable_cache:
        Whether templates should be cached in memory for faster subsequent
        lookups.  Enabled by default.
    """

    return BusinessMessages(
        session_factory,
        enable_cache=enable_cache,
        default_language=default_language,
    )


def get(
    key: str,
    *,
    version: int | None = None,
    language: str | None = None,
    refresh: bool = False,
) -> MessageTemplate:
    """Resolve a template using the module level :data:`bm` instance."""

    return bm.get(key, version=version, language=language, refresh=refresh)


def get_key(
    key: str,
    *,
    version: int | None = None,
    language: str | None = None,
    refresh: bool = False,
) -> MessageTemplate:
    """Alias for :func:`get` with a more explicit semantic name."""

    return get(key, version=version, language=language, refresh=refresh)


def payload(
    key: str,
    values: Mapping[str, Any] | None = None,
    *,
    version: int | None = None,
    language: str | None = None,
    include_http_status: bool = True,
    include_variables: bool = True,
    refresh: bool = False,
) -> Dict[str, Any]:
    """Resolve and render a template using the default client instance."""

    return bm.payload(
        key,
        values,
        version=version,
        language=language,
        include_http_status=include_http_status,
        include_variables=include_variables,
        refresh=refresh,
    )


def problem(
    key: str,
    values: Mapping[str, Any] | None = None,
    *,
    version: int | None = None,
    language: str | None = None,
    default_status: int = 400,
    include_http_status: bool = True,
    include_variables: bool = True,
    refresh: bool = False,
) -> Dict[str, Any]:
    """Return a dictionary containing ``status`` and ``payload`` fields."""

    return bm.problem(
        key,
        values,
        version=version,
        language=language,
        default_status=default_status,
        include_http_status=include_http_status,
        include_variables=include_variables,
        refresh=refresh,
    )

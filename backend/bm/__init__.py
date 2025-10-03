"""Business Messages convenience helpers exposed as a user-friendly package.

The :mod:`bm` package mirrors the ergonomics of frameworks such as FastAPI and
the structure of the :mod:`typing` module by grouping its public API through
documented exports.  It gives consumers a single import location for working
with business message templates in a declarative style.

The module exposes the following categories:

* **Client helpers** – :class:`BusinessMessages` is the primary entry point and
  :func:`create` provides an explicit constructor with optional configuration.
* **Shortcut functions** – :data:`bm` is a ready-to-use singleton backed by the
  default session factory, while :func:`get`, :func:`get_key`, :func:`payload`,
  and :func:`problem` delegate to it for quick one-off usage.
* **Domain objects** – :class:`MessageTemplate` encapsulates a rendered
  template, and :class:`MessageCatalogError` plus its specialised subclasses
  describe the error surface.

Example usage::

    from bm import create, payload

    client = create()
    payload_data = payload("invoice_created", values={"id": "42"})
    print(payload_data["body"])

    from bm import BusinessMessages, MessageNotFoundError

    try:
        template = BusinessMessages().get("welcome")
    except MessageNotFoundError:
        ...

Any symbol not listed in :data:`__all__` is considered an internal
implementation detail and may change without notice.
"""

from __future__ import annotations

from .client import (
    BusinessMessages,
    MessageCatalogError,
    MessageNotFoundError,
    MessageTemplate,
    MissingMessageVariablesError,
    bm,
    create,
    get,
    get_key,
    payload,
    problem,
)

# Please keep __all__ alphabetised within each section.
__all__ = [
    # Client helpers
    "bm",
    "BusinessMessages",
    "create",

    # Shortcut functions
    "get",
    "get_key",
    "payload",
    "problem",

    # Domain objects
    "MessageCatalogError",
    "MessageNotFoundError",
    "MessageTemplate",
    "MissingMessageVariablesError",
]

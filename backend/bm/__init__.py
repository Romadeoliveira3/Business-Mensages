"""Public interface for the business messages helper package."""

from .client import (
    BusinessMessages,
    MessageCatalog,
    MessageCatalogError,
    MessageNotFoundError,
    MessageTemplate,
    MissingMessageVariablesError,
    bm,
    create,
)

_DELEGATED_METHODS = {"get", "payload", "problem", "format_error"}

__all__ = [
    "BusinessMessages",
    "MessageCatalog",
    "MessageCatalogError",
    "MessageNotFoundError",
    "MessageTemplate",
    "MissingMessageVariablesError",
    "bm",
    "create",
    "format_error",
    "get",
    "payload",
    "problem",
]


def __getattr__(name: str):
    if name in _DELEGATED_METHODS:
        return getattr(bm, name)
    raise AttributeError(f"module 'bm' has no attribute '{name}'")


def __dir__() -> list[str]:
    return sorted({*globals().keys(), *_DELEGATED_METHODS})


"""Seed the application database by inserting messages directly in the database."""

from __future__ import annotations

import json
import os
import sys
import time

from app.db.session import SessionLocal
from app.schemas.business_message import BusinessMessageCreate
from app.services.message_service import create_message
from sqlalchemy.exc import IntegrityError


DEFAULT_MESSAGES = [
    {
        "message_key": "welcome_message",
        "variables": ["user_name"],
        "http_status": 200,
        "updated_by": "seed-script",
        "translations": [
            {
                "language_code": "en",
                "language_name": "English",
                "title": "Welcome to Business Messages",
                "body": "{\"message\": \"Hello {user_name}, welcome aboard!\"}",
            },
            {
                "language_code": "pt-BR",
                "language_name": "Português (Brasil)",
                "title": "Bem-vindo ao Business Messages",
                "body": "{\"message\": \"Olá {user_name}, bem-vindo a bordo!\"}",
            },
        ],
    },
    {
        "message_key": "payment_failed",
        "variables": ["user_name", "card_last4"],
        "http_status": 402,
        "updated_by": "seed-script",
        "translations": [
            {
                "language_code": "en",
                "language_name": "English",
                "title": "Payment Failure",
                "body": "Dear {user_name}, we were unable to process your payment ending in {card_last4}.",
            },
            {
                "language_code": "pt-BR",
                "language_name": "Português (Brasil)",
                "title": "Falha no pagamento",
                "body": "Olá {user_name}, não conseguimos processar seu pagamento com final {card_last4}.",
            },
        ],
    },
    {
        "message_key": "password_reset",
        "variables": ["reset_token"],
        "http_status": 200,
        "updated_by": "seed-script",
        "translations": [
            {
                "language_code": "en",
                "language_name": "English",
                "title": "Password reset instructions",
                "body": "{\"subject\": \"Password reset\", \"content\": \"Use the token {reset_token} within 10 minutes.\"}",
            },
            {
                "language_code": "pt-BR",
                "language_name": "Português (Brasil)",
                "title": "Instruções para redefinir a senha",
                "body": "{\"subject\": \"Redefinição de senha\", \"content\": \"Use o token {reset_token} em até 10 minutos.\"}",
            },
        ],
    },
]



def main() -> int:
    payload_path = os.getenv("SEED_PAYLOAD_FILE")

    if payload_path:
        try:
            with open(payload_path, "r", encoding="utf-8") as fh:
                messages = json.load(fh)
            if not isinstance(messages, list):
                raise ValueError("Seed payload file must contain a list of message definitions")
        except OSError as exc:
            print(f"Failed to read seed payload file '{payload_path}': {exc}", file=sys.stderr)
            return 1
        except ValueError as exc:
            print(str(exc), file=sys.stderr)
            return 1
    else:
        messages = DEFAULT_MESSAGES

    db = SessionLocal()
    failures = []
    for msg in messages:
        try:
            payload = dict(msg)
            if "translations" not in payload:
                title = payload.pop("title", None)
                body = payload.pop("body", None)
                if title is None or body is None:
                    raise ValueError(
                        "Message definition must include either translations or both title and body"
                    )
                payload["translations"] = [
                    {
                        "language_code": payload.pop("language_code", "en"),
                        "language_name": payload.pop("language_name", None),
                        "title": title,
                        "body": body,
                    }
                ]
            obj_in = BusinessMessageCreate(**payload)
            create_message(db, obj_in)
            print(f"[OK] {msg['message_key']}")
        except IntegrityError as exc:
            db.rollback()
            print(f"[SKIP] {msg['message_key']} (já existe)")
        except Exception as exc:
            db.rollback()
            print(f"[ERROR] {msg['message_key']}: {exc}")
            failures.append(msg['message_key'])
    db.close()

    if failures:
        print(f"Falha ao inserir: {', '.join(failures)}", file=sys.stderr)
        return 1
    return 0

    for result in results:
        status = "ok" if result.success else "error"
        detail = f" - {result.detail}" if result.detail else ""
        print(f"[{status.upper()}] {result.key} (status={result.status}){detail}")

    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())

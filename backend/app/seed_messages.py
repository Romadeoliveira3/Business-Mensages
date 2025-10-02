
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
        "title": "Welcome to Business Messages",
        "body": "{\"message\": \"Hello {user_name}, welcome aboard!\"}",
        "variables": ["user_name"],
        "http_status": 200,
        "updated_by": "seed-script",
    },
    {
        "message_key": "payment_failed",
        "title": "Payment Failure",
        "body": "Dear {user_name}, we were unable to process your payment ending in {card_last4}.",
        "variables": ["user_name", "card_last4"],
        "http_status": 402,
        "updated_by": "seed-script",
    },
    {
        "message_key": "password_reset",
        "title": "Password reset instructions",
        "body": "{\"subject\": \"Password reset\", \"content\": \"Use the token {reset_token} within 10 minutes.\"}",
        "variables": ["reset_token"],
        "http_status": 200,
        "updated_by": "seed-script",
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
            obj_in = BusinessMessageCreate(**msg)
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

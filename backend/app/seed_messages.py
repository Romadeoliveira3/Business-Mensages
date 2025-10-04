from __future__ import annotations

import json
import os
import sys

from sqlalchemy.exc import IntegrityError

from app.db.session import SessionLocal
from app.schemas.business_message import BusinessMessageCreate
from app.services.message_service import create_message


DEFAULT_MESSAGES = [
    {
        "message_key": "welcome_message",
        "code": "BM-WELCOME-001",
        "translations": [
            {
                "language_code": "en",
                "title": "Welcome to Business Messages",
            },
            {
                "language_code": "pt-BR",
                "title": "Bem-vindo ao Business Messages",
            },
        ],
    },
    {
        "message_key": "payment_failed",
        "code": "BM-PAYMENT-001",
        "translations": [
            {
                "language_code": "en",
                "title": "Payment Failure",
            },
            {
                "language_code": "pt-BR",
                "title": "Falha no pagamento",
            },
        ],
    },
    {
        "message_key": "password_reset",
        "code": "BM-SECURITY-001",
        "translations": [
            {
                "language_code": "en",
                "title": "Password reset instructions",
            },
            {
                "language_code": "pt-BR",
                "title": "Instruções para redefinir a senha",
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
                language_code = payload.pop("language_code", "en")
                if title is None:
                    raise ValueError(
                        "Message definition must include either translations or a title",
                    )
                payload["translations"] = [
                    {
                        "language_code": language_code,
                        "title": title,
                    }
                ]
            obj_in = BusinessMessageCreate(**payload)
            create_message(db, obj_in)
            print(f"[OK] {msg['message_key']}")
        except IntegrityError:
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


if __name__ == "__main__":
    raise SystemExit(main())

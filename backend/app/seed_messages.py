"""Seed the application database by calling the public message API."""

from __future__ import annotations

import json
import os
import sys
import time
from dataclasses import dataclass
from typing import Iterable
from urllib import error, request
from urllib.parse import urljoin

DEFAULT_BASE_URL = "http://localhost:8000"
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


@dataclass
class SeedResult:
    """Result of a single message seed operation."""

    key: str
    success: bool
    status: int
    detail: str | None = None


class MessageSeeder:
    """Seed helper that creates messages through the HTTP API."""

    def __init__(self, base_url: str, retries: int = 12, retry_delay: float = 5.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.retries = retries
        self.retry_delay = retry_delay

    def _request(self, path: str, payload: dict) -> SeedResult:
        url = urljoin(self.base_url + "/", path.lstrip("/"))
        data = json.dumps(payload).encode("utf-8")
        req = request.Request(url, data=data, method="POST", headers={"Content-Type": "application/json"})

        try:
            with request.urlopen(req) as resp:
                body = resp.read().decode("utf-8")
                detail = body or None
                return SeedResult(payload["message_key"], True, resp.status, detail)
        except error.HTTPError as exc:  # pragma: no cover - network invocation
            if exc.code == 409:
                return SeedResult(payload["message_key"], True, exc.code, "Already exists")
            detail = exc.read().decode("utf-8") if exc.fp else str(exc)
            return SeedResult(payload["message_key"], False, exc.code, detail)
        except error.URLError as exc:  # pragma: no cover - network invocation
            raise ConnectionError(f"Failed to reach API at {url}: {exc.reason}") from exc

    def _wait_for_api(self) -> None:
        health_url = urljoin(self.base_url + "/", "")
        for attempt in range(1, self.retries + 1):
            try:
                with request.urlopen(health_url) as resp:
                    if resp.status < 500:
                        return
            except error.URLError:
                pass
            time.sleep(self.retry_delay)
        raise TimeoutError(f"API at {self.base_url} did not become reachable after {self.retries} attempts")

    def seed_messages(self, messages: Iterable[dict]) -> list[SeedResult]:
        self._wait_for_api()
        results: list[SeedResult] = []
        for message in messages:
            results.append(self._request("/messages", message))
        return results


def main() -> int:
    base_url = os.getenv("SEED_BASE_URL", DEFAULT_BASE_URL)
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

    seeder = MessageSeeder(base_url)

    try:
        results = seeder.seed_messages(messages)
    except (ConnectionError, TimeoutError) as exc:
        print(str(exc), file=sys.stderr)
        return 1

    failures = [result for result in results if not result.success]

    for result in results:
        status = "ok" if result.success else "error"
        detail = f" - {result.detail}" if result.detail else ""
        print(f"[{status.upper()}] {result.key} (status={result.status}){detail}")

    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install --no-install-recommends -y build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --no-cache-dir poetry==1.7.1 \
    && poetry config virtualenvs.create false

COPY pyproject.toml ./
# Install dependencies only (avoid installing the project itself to skip README requirement)
RUN poetry install --only main --no-interaction --no-ansi --no-root

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./
COPY start.sh ./
RUN chmod +x /app/start.sh

EXPOSE 8000

CMD ["/app/start.sh"]

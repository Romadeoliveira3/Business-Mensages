# Backend

This directory contains the Python backend for Business Messages Manager. The
service is built with FastAPI, SQLAlchemy, and Alembic, and it is managed via
Poetry. The project is container-first and is designed to run locally through
Docker Compose together with a dedicated PostgreSQL database.

## Project layout

```
backend/
├── app/                 # FastAPI application package
│   ├── core/            # Application configuration and shared settings
│   ├── db/              # Database engine, sessions, and SQLAlchemy base
│   └── main.py          # FastAPI entry point
├── alembic/             # Alembic migration environment
├── alembic.ini          # Alembic configuration file
├── Dockerfile           # Container build definition (Poetry-based)
├── pyproject.toml       # Poetry project configuration
└── README.md            # This file
```

## Running locally with Docker Compose

1. Create a `.env` file at the repository root based on `.env.example`:

   ```bash
   cp .env.example .env
   ```

   Adjust the values if you need to customize database credentials or the API
   host/port.

2. Build and start the services:

   ```bash
   docker compose up --build
   ```

   The FastAPI server will be available at <http://localhost:8000> and the
   PostgreSQL database will be exposed on port `5432`.

3. Generate new database migrations with Alembic after adding SQLAlchemy models:

   ```bash
   docker compose run --rm backend alembic revision --autogenerate -m "create example table"
   docker compose run --rm backend alembic upgrade head
   ```

## Development notes

- Dependencies are managed with Poetry inside the container. If you need to
  execute Poetry commands locally, install Poetry and run them from the
  `backend/` directory.
- Add your SQLAlchemy models under `app/db/` (or within dedicated `app/models`
  modules) and import them in `app/db/base.py` so that Alembic can discover the
  metadata.
- Update `app/main.py` with routers and middleware as the project grows.

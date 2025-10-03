# Run and deploy your app

This repository is now organized into dedicated frontend and backend workspaces so you can evolve the Business Messages Manager
into a full stack application.

## Project structure

- `frontend/` – React user interface powered by Vite.
- `backend/` – FastAPI service managed with Poetry, SQLAlchemy, and Alembic.

## Frontend setup

**Prerequisites:** Node.js

1. Change into the frontend workspace: `cd frontend`
2. Install dependencies: `npm install`
3. Set the `AI_API_KEY` in `frontend/.env.local` to the API key for your preferred provider
4. Run the app locally: `npm run dev`

## Backend setup (FastAPI + PostgreSQL)

The backend is containerized and ships with Docker and Docker Compose workflows.

1. Copy the example environment file and adjust it as needed:

   ```bash
   cp .env.example .env
   ```

2. Build and start the full application stack (frontend, backend, and PostgreSQL database):

   ```bash
   # Recommended (avoids Docker Desktop credential helper issues)
   make up

   # Or, if you prefer raw Compose:
   docker compose up --build
   ```

   The frontend will be served at <http://localhost:5173>, the API will be
   available at <http://localhost:8000>, and PostgreSQL on `localhost:5432`.

   Troubleshooting: if you hit `error getting credentials - err: exit status 1`
   during image pull/build, prefer `make up`. The Makefile can use a repo-local
   `.docker-config/` to bypass the broken `credsStore: desktop` on some setups
   (the folder is ignored by git). To use your global Docker config instead and
   avoid creating `.docker-config/`, run `make LOCAL_DOCKER_CONFIG=0 up`.

## Backend logs

The backend runs with `--reload` and `--log-level debug` for development.
Tail logs and see stack traces for 500 errors with:

```bash
docker compose logs -f backend
```

3. Seed the database with example messages (after the API is running):

   ```bash
   docker compose run --rm backend poetry run python app/seed_messages.py
   ```

   You can customise the payload by providing a JSON file via the
   `SEED_PAYLOAD_FILE` environment variable, or point the script to a
   different API origin with `SEED_BASE_URL`.

4. Use Alembic for database migrations:

   ```bash
   docker compose run --rm backend alembic revision --autogenerate -m "init"
   docker compose run --rm backend alembic upgrade head
   ```

You can continue to evolve the FastAPI application under `backend/app/` and add
SQLAlchemy models to power the Business Messages Manager frontend.

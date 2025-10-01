<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This repository is now organized into dedicated frontend and backend workspaces so you can evolve the Business Messages Manager
into a full stack application.

View your app in AI Studio: https://ai.studio/apps/drive/19MQkL1MzVKXPkj9ZsYVAH9s7pbN1VwV6

## Project structure

- `frontend/` – React user interface powered by Vite.
- `backend/` – FastAPI service managed with Poetry, SQLAlchemy, and Alembic.

## Frontend setup

**Prerequisites:** Node.js

1. Change into the frontend workspace: `cd frontend`
2. Install dependencies: `npm install`
3. Set the `GEMINI_API_KEY` in `frontend/.env.local` to your Gemini API key
4. Run the app locally: `npm run dev`

## Backend setup (FastAPI + PostgreSQL)

The backend is containerized and ships with Docker and Docker Compose workflows.

1. Copy the example environment file and adjust it as needed:

   ```bash
   cp .env.example .env
   ```

2. Start the FastAPI service and PostgreSQL database:

   ```bash
   docker compose up --build
   ```

   The API will be available at <http://localhost:8000> and PostgreSQL on
   `localhost:5432`.

3. Use Alembic for database migrations:

   ```bash
   docker compose run --rm backend alembic revision --autogenerate -m "init"
   docker compose run --rm backend alembic upgrade head
   ```

You can continue to evolve the FastAPI application under `backend/app/` and add
SQLAlchemy models to power the Business Messages Manager frontend.

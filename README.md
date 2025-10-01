<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This repository is now organized into dedicated frontend and backend workspaces so you can evolve the Business Messages Manager into a full stack application.

View your app in AI Studio: https://ai.studio/apps/drive/19MQkL1MzVKXPkj9ZsYVAH9s7pbN1VwV6

## Project structure

- `frontend/` – React user interface powered by Vite.
- `backend/` – Placeholder directory for a future Python API or service layer.

## Frontend setup

**Prerequisites:** Node.js

1. Change into the frontend workspace: `cd frontend`
2. Install dependencies: `npm install`
3. Set the `GEMINI_API_KEY` in `frontend/.env.local` to your Gemini API key
4. Run the app locally: `npm run dev`

## Backend setup (Python)

The backend folder currently contains guidance for implementing a Python service. Populate it with FastAPI, Flask, or your preferred framework when you are ready to add server-side functionality.

# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

WORKDIR /app

# Copy lockfile to ensure deterministic install and correct esbuild pairing
COPY package.json package-lock.json ./

# Install dependencies pinned by lockfile
RUN npm ci --no-audit --no-fund \
 && npm rebuild esbuild || true

# Copy the rest of the app
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

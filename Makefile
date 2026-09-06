.SILENT:

# Development helper for the DBCS dashboard (Rust backend + React/Vite frontend).
# Run `make dev` to start the backend (:3000) and the Vite dev server (:8080)
# together; Ctrl-C tears both down.

BACKEND_PORT ?= 3000

# Docker Compose file for the containerised stack (dashboard + Keycloak).
COMPOSE := docker compose -f docker/compose.yml

.PHONY: dev dev-backend dev-frontend web-install web-build clean \
        docker-build docker-up docker-down docker-logs docker-restart \
        keycloak-up keycloak-down keycloak-logs

# Frontend deps (once, or after package.json changes).
web-install:
	cd apps/web && bun install

# Production frontend build -> apps/web/dist (single source, Rust serves from there).
web-build:
	cd apps/web && bun run build

# Backend only: Rust service on $(BACKEND_PORT).
dev-backend:
	cd apps/api && PORT=$(BACKEND_PORT) cargo run

# Frontend only: Vite dev server on :8080 (proxies /api -> backend).
# Installs deps first if node_modules is missing.
dev-frontend:
	@if [ ! -d apps/web/node_modules ]; then (cd apps/web && bun install); fi
	cd apps/web && bun run dev

# Both together: backend in the background, Vite in the foreground, cleaned up on exit.
# Installs frontend deps first if node_modules is missing.
dev:
	@trap 'kill 0' EXIT; \
	(cd apps/api && PORT=$(BACKEND_PORT) cargo run) & \
	(cd apps/web && { [ -d node_modules ] || bun install; } && bun run dev) & \
	wait

# --- Containerised stack (Docker Compose) ---

# Build the dashboard image.
docker-build:
	$(COMPOSE) build

# Start the dashboard + Keycloak (detached).
docker-up:
	$(COMPOSE) up -d --build

# Stop and remove the containers.
docker-down:
	$(COMPOSE) down

# Follow the container logs.
docker-logs:
	$(COMPOSE) logs -f

# Rebuild and restart the stack.
docker-restart: docker-down docker-build docker-up

# --- Housekeeping ---

# Remove build artifacts (Rust target dir, frontend deps and build output).
clean:
	rm -rf apps/api/target apps/web/node_modules apps/web/dist

# --- Keycloak only (for local backend dev against a containerised IdP) ---

# Start just the Keycloak container (detached, on :9090) so you can run the
# Rust backend locally with KEYCLOAK_URL=http://localhost:9090/realms/rserver.
keycloak-up:
	$(COMPOSE) up -d keycloak

# Stop the Keycloak container.
keycloak-down:
	$(COMPOSE) stop keycloak

# Follow the Keycloak logs.
keycloak-logs:
	$(COMPOSE) logs -f keycloak

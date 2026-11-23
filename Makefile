.SILENT:

# Development helper for the weather service (Go backend + Preact/Vite frontend).
# Run `make dev` to start the backend (:3000) and the Vite dev server (:8080)
# together; Ctrl-C tears both down.

BACKEND_PORT ?= 3000
BINARY := apps/api/weather-service

# Docker Compose file for the containerised stack.
COMPOSE := docker compose -f docker/compose.yml

.PHONY: build dev dev-backend dev-frontend web-install web-build web-test api-build api-test clean \
        docker-build docker-up docker-down docker-logs docker-restart

# Frontend deps (once, or after package.json changes).
web-install:
	cd apps/web && bun install

# Production frontend build -> apps/web/dist (single source, Go serves from there).
web-build: web-install
	cd apps/web && bun run build

# Run the frontend test suite (vitest).
web-test: web-install
	cd apps/web && bun run test

# Backend only: Go service on $(BACKEND_PORT).
dev-backend:
	cd apps/api && PORT=$(BACKEND_PORT) go run .

# Frontend only: Vite dev server on :8080 (proxies /api -> backend).
# Installs deps first if node_modules is missing.
dev-frontend:
	@if [ ! -d apps/web/node_modules ]; then (cd apps/web && bun install); fi
	cd apps/web && bun run dev

# Both together: backend in the background, Vite in the foreground, cleaned up on exit.
# Installs frontend deps first if node_modules is missing.
dev:
	@trap 'kill 0' EXIT; \
	(cd apps/api && PORT=$(BACKEND_PORT) go run .) & \
	(cd apps/web && { [ -d node_modules ] || bun install; } && bun run dev) & \
	wait

# Build a stripped, statically linked backend binary into $(BINARY).
api-build:
	cd apps/api && CGO_ENABLED=0 go build -trimpath -buildvcs=false -ldflags="-s -w -buildid=" -o weather-service .
	# upx --best weather-service

# Run the backend test suite.
api-test:
	cd apps/api && go test ./...

# Build both local artifacts: the Go binary and the frontend assets.
build: api-build web-build

# --- Tests ---

# Run both the backend and the frontend test suites.
test:
	$(MAKE) api-test
	$(MAKE) web-test

# --- Containerised stack (Docker Compose) ---

# Build the dashboard image.
docker-build:
	$(COMPOSE) build

# Start the service (detached).
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

# Remove build artifacts (Go binary, frontend deps and build output).
clean:
	rm -f $(BINARY)
	rm -rf apps/web/node_modules apps/web/dist

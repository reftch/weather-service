# Weather Service

A full-stack web application providing weather information, city search (via Open-Meteo Geocoding), and reverse geocoding (via Photon), along with current weather forecasts (via Open-Meteo).

## Features

- **City Search**: Search for cities using keywords through Open-Meteo's geocoding API.
- **Reverse Geocoding**: Get location details from latitude and longitude via Photon.
- **Weather Forecast**: Real-time weather updates including temperature, wind speed, and more.
- **Modern Frontend**: Built with Preact, Tailwind CSS, and Vite.
- **High Performance**: Go backend with a statically linked binary.

## Prerequisites

- [Go 1.27.4](https://go.dev/dl/)
- [Bun](https://bun.sh/)
- [Docker](https://docs.docker.com/get-docker/)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd weather-service
```

### 2. Run locally

#### Backend (Go)

The backend is a single Go module in `apps/api` with no third-party Go dependencies.

```bash
cd apps/api
go run .
```

It listens on `HOST:PORT` (by default `127.0.0.1:8080`). `make dev-backend` starts it on
port 3000 instead, which is what the Vite dev server proxies to.

#### Frontend (Bun/Vite)

```bash
cd apps/web
bun install
bun run dev
```

The frontend is available at `http://localhost:8080` and proxies `/api` to the backend.

#### Everything at once

```bash
make dev
```

### 3. Build the project

#### Backend

```bash
cd apps/api
go build
```

Or use `make api-build` for a stripped, static binary at `apps/api/weather-service`.
Run the tests with `make api-test`.

#### Frontend

```bash
cd apps/web
bun install
bun run build
```

Output goes to `apps/web/dist`, which is what the backend serves.

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Listen address (`0.0.0.0` in the container). |
| `PORT` | `8080` | Listen port (`8083` in the container). |
| `ASSETS_PATH` | auto-detected | Built frontend directory (`/assets` in the container). |
| `METEO_API` | `https://api.open-meteo.com` | Open-Meteo forecast base URL. |
| `GEOCODE_API` | `https://geocoding-api.open-meteo.com` | Open-Meteo city search base URL. |
| `PHOTON_API` | `https://photon.komoot.io` | Photon base URL (reverse geocoding only). |

### External services

| Feature | Provider | Endpoint used |
| --- | --- | --- |
| City search | Open-Meteo Geocoding | `https://geocoding-api.open-meteo.com/v1/search` |
| Weather forecast | Open-Meteo | `https://api.open-meteo.com/v1/forecast` |
| Reverse geocoding | Photon | `https://photon.komoot.io/reverse` |

City search uses Open-Meteo's geocoding API because the public Photon instance rate-limits
bursty traffic. The backend converts the Open-Meteo response into the same GeoJSON shape
the frontend previously received from Photon, so the `/api/v1/cities` contract is unchanged.
`GEOCODE_API` can point at a self-hosted or alternative Open-Meteo-compatible geocoder.

## Docker Deployment

The multi-stage Dockerfile builds the frontend assets with Bun and the backend as a
static Go binary, then copies both into a minimal `scratch` image. The binary is
stripped and packed with a pinned UPX release, which brings the image to roughly
3 MB. If you prefer an uncompressed binary, remove the `upx --best` line from the
Go build step in `docker/Dockerfile`.

### Build and Run with Docker Compose

```bash
docker compose -f docker/compose.yml up -d
```

Or with the Makefile: `make docker-up` (and `make docker-down` to stop).

### Build the Docker Image manually

```bash
docker build -t weather-service:0.1.1 -f docker/Dockerfile .
```

### Running the Container

```bash
docker run -p 8083:8083 \
  -e METEO_API=https://api.open-meteo.com \
  -e GEOCODE_API=https://geocoding-api.open-meteo.com \
  -e PHOTON_API=https://photon.komoot.io \
  weather-service:0.1.1
```

The service will be accessible at `http://localhost:8083`.

The image already sets these three upstream URLs as defaults, so the `-e` flags are only
needed when overriding them. `docker/compose.yml` sets the same values explicitly.

## API Endpoints

### City Search

`GET /api/v1/cities?keyword=<name>`

Searches populated places through Open-Meteo Geocoding and returns a GeoJSON
`FeatureCollection` (`type`, `geometry.coordinates`, and `properties` such as `name`,
`state`, `country`, `countrycode`, and `postcode`). The keyword is URL-decoded and trimmed
before the upstream request.

### Reverse Geocoding

`GET /api/v1/reverse?lat=<latitude>&lon=<longitude>`

Returns Photon's reverse-geocoding GeoJSON for the given coordinates.

### Weather Forecast

`GET /api/v1/temperature?latidude=<latitude>&longtitude=<longitude>`

The misspelled parameter names are intentional and kept for compatibility with the web app.

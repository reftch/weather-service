# Weather Service

A full-stack web application providing weather information, city search (via Photon), and reverse geocoding, along with current weather forecasts (via Open-Meteo).

## Features

- **City Search**: Search for cities using keywords.
- **Reverse Geocoding**: Get location details from latitude and longitude.
- **Weather Forecast**: Real-time weather updates including temperature, wind speed, and more.
- **Modern Frontend**: Built with Preact, Tailwind CSS, and Vite.
- **High Performance**: Rust backend with a statically linked binary.

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install)
- [Bun](https://bun.sh/)
- [Docker](https://docs.docker.com/get-docker/)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd weather-service
```

### 2. Run locally

#### Backend (Rust)

The backend uses `r-server`. You can run it directly using Cargo:

```bash
cargo run
```

The server will start on `http://0.0.0.0:8083`.

#### Frontend (Bun/Vite)

Navigate to the `web` directory, install dependencies, and start the development server:

```bash
cd web
bun install
bun dev
```

The frontend will be available at the URL provided by Vite (typically `http://localhost:5173`).

### 3. Build the project

#### Backend

To build the release binary:

```bash
cargo build --release
```

#### Frontend

To build the production frontend assets:

```bash
cd web
bun install
bun build
```

## Docker Deployment

The project is containerized using a multi-stage Dockerfile that builds both the frontend assets and the statically linked Rust binary.

### Build and Run with Docker Compose

The easiest way to run the service is using Docker Compose:

```bash
docker compose -f docker/compose.yml up -d
```

This will build the image and start the container.

### Build the Docker Image manually

If you want to build the image without using Compose:

```bash
docker build -t weather-service:0.1.1 -f docker/Dockerfile .
```

### Running the Container

To run the container manually:

```bash
docker run -p 8083:8083 weather-service:0.1.1
```

The service will be accessible at `http://localhost:8083`.

## API Endpoints

### City Search

`GET /api/v1/cities?keyword=<name>`

### Reverse Geocoding

`GET /api/v1/reverse?lat=<latitude>&lon=<longitude>`

### Weather Forecast

`GET /api/v1/temperature?latidude=<latitude>&longtitude=<longitude>`

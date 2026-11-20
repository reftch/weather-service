ARG ARTIFACT=weather-service
ARG UPX_VERSION=5.3.0

# Stage 1: build the frontend assets and a statically linked Go binary.
FROM golang:1.27.4-alpine AS builder

ARG ARTIFACT
ARG UPX_VERSION
ARG TARGETOS=linux
ARG TARGETARCH=amd64

# Bun needs libstdc++ (it is written in C++) plus the tools its installer uses.
RUN apk add --no-cache ca-certificates curl bash unzip libstdc++ xz

# Install Bun for the frontend build.
ENV BUN_INSTALL=/root/.bun
ENV PATH=$BUN_INSTALL/bin:$PATH
RUN curl -fsSL https://bun.sh/install | bash

# Pin UPX: older versions had intermittent SIGSEGV bugs with Go binaries.
RUN curl -fsSL "https://github.com/upx/upx/releases/download/v${UPX_VERSION}/upx-${UPX_VERSION}-${TARGETARCH}_linux.tar.xz" \
    | xz -dc | tar -x -C /usr/local/bin --strip-components=1 \
      "upx-${UPX_VERSION}-${TARGETARCH}_linux/upx"

WORKDIR /app

# Copy sources first; Go has no external module dependencies to cache.
COPY apps ./apps

RUN bun install --cwd apps/web
RUN bun --cwd apps/web build

# CGO_ENABLED=0 produces a fully static binary that can run on scratch.
# UPX packing cuts the binary to roughly a third of its original size.
RUN cd apps/api && \
    CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -trimpath -buildvcs=false -ldflags="-s -w -buildid=" -o /$ARTIFACT . && \
    upx --best /$ARTIFACT

# Stage 2: minimal runtime image — just the binary, CA certs and frontend.
FROM scratch

ARG ARTIFACT

COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=builder /$ARTIFACT /application
COPY --from=builder /app/apps/web/dist /assets

ENV HOST=0.0.0.0
ENV PORT=8083
ENV ASSETS_PATH=/assets
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

ENTRYPOINT ["/application"]

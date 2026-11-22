// Package main implements the weather-service HTTP API.
package main

import (
	"context"
	"errors"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"
)

const (
	defaultHost       = "127.0.0.1"
	defaultPort       = 8080
	defaultMeteoAPI   = "https://api.open-meteo.com"
	defaultGeocodeAPI = "https://geocoding-api.open-meteo.com"
	defaultPhotonAPI  = "https://photon.komoot.io"
)

type config struct {
	host       string
	port       int
	assetsPath string
	meteoAPI   string
	geocodeAPI string
	photonAPI  string
}

func main() {
	cfg := loadConfig()

	handler, err := newRouter(cfg)
	if err != nil {
		log.Fatalf("configuration error: %v", err)
	}

	srv := &http.Server{
		Addr:              net.JoinHostPort(cfg.host, strconv.Itoa(cfg.port)),
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	errCh := make(chan error, 1)
	go func() {
		log.Printf("weather-service listening on http://%s (assets: %s)", srv.Addr, cfg.assetsPath)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
			return
		}
		close(errCh)
	}()

	select {
	case err := <-errCh:
		if err != nil {
			log.Fatalf("server failed: %v", err)
		}
	case <-ctx.Done():
		log.Println("shutting down...")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		if err := srv.Shutdown(shutdownCtx); err != nil {
			log.Printf("graceful shutdown failed: %v", err)
		}
	}
}

func loadConfig() config {
	port := defaultPort
	if raw := os.Getenv("PORT"); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed < 1 || parsed > 65535 {
			log.Printf("invalid PORT %q, using %d", raw, defaultPort)
		} else {
			port = parsed
		}
	}

	return config{
		host:       envOrDefault("HOST", defaultHost),
		port:       port,
		assetsPath: resolveAssetsPath(),
		meteoAPI:   envOrDefault("METEO_API", defaultMeteoAPI),
		geocodeAPI: envOrDefault("GEOCODE_API", defaultGeocodeAPI),
		photonAPI:  envOrDefault("PHOTON_API", defaultPhotonAPI),
	}
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// resolveAssetsPath keeps the lookup order of the previous Rust implementation
// so local development and the container both find the built frontend.
func resolveAssetsPath() string {
	if p := os.Getenv("ASSETS_PATH"); p != "" {
		return p
	}
	for _, candidate := range []string{
		"../web/dist",
		"apps/web/dist",
		"./assets",
		"/assets",
		"web/dist",
	} {
		if info, err := os.Stat(candidate); err == nil && info.IsDir() {
			return candidate
		}
	}
	return "../web/dist"
}

package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const upstreamTimeout = 10 * time.Second

type apiHandlers struct {
	meteoURL  *url.URL
	photonURL *url.URL
	client    *http.Client
}

func newRouter(cfg config) (http.Handler, error) {
	meteoURL, err := url.Parse(cfg.meteoAPI)
	if err != nil {
		return nil, fmt.Errorf("invalid METEO_API %q: %w", cfg.meteoAPI, err)
	}
	photonURL, err := url.Parse(cfg.photonAPI)
	if err != nil {
		return nil, fmt.Errorf("invalid PHOTON_API %q: %w", cfg.photonAPI, err)
	}

	api := &apiHandlers{
		meteoURL:  meteoURL,
		photonURL: photonURL,
		client:    &http.Client{Timeout: upstreamTimeout},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/cities", api.getCities)
	mux.HandleFunc("GET /api/v1/reverse", api.getReverse)
	mux.HandleFunc("GET /api/v1/temperature", api.getTemperature)
	mux.Handle("/", staticHandler(cfg.assetsPath))
	return mux, nil
}

func (a *apiHandlers) getCities(w http.ResponseWriter, r *http.Request) {
	keyword := r.URL.Query().Get("keyword")
	if keyword == "" {
		badRequest(w, "Missing keyword")
		return
	}

	log.Printf("keyword: %s", keyword)
	a.proxy(w, r, a.photonURL, "/api/", url.Values{"q": {keyword}})
}

func (a *apiHandlers) getReverse(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	latitude := query.Get("lat")
	longitude := query.Get("lon")
	if latitude == "" {
		badRequest(w, "Missing latitude")
		return
	}
	if longitude == "" {
		badRequest(w, "Missing longtitude")
		return
	}

	log.Printf("reverse latitude=%s longitude=%s", latitude, longitude)
	a.proxy(w, r, a.photonURL, "/reverse", url.Values{"lat": {latitude}, "lon": {longitude}})
}

func (a *apiHandlers) getTemperature(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	// The misspelled parameter names are kept for compatibility with the web app.
	latitude := query.Get("latidude")
	longitude := query.Get("longtitude")
	if latitude == "" {
		badRequest(w, "Missing latidude")
		return
	}
	if longitude == "" {
		badRequest(w, "Missing longtitude")
		return
	}

	log.Printf("temperature latitude=%s longitude=%s", latitude, longitude)

	upstreamQuery := url.Values{
		"latitude":      {latitude},
		"longitude":     {longitude},
		"forecast_days": {"10"},
		"timezone":      {"auto"},
	}
	for _, field := range []string{"temperature_2m", "weather_code", "wind_speed_10m", "cloud_cover"} {
		upstreamQuery.Add("current", field)
	}
	upstreamQuery.Add("hourly", "temperature_2m,precipitation_probability,wind_speed_10m,cloud_cover")
	upstreamQuery.Add("daily", "temperature_2m_max,temperature_2m_min,sunrise,sunset,weather_code,precipitation_sum,wind_speed_10m_max")

	a.proxy(w, r, a.meteoURL, "/v1/forecast", upstreamQuery)
}

// proxy forwards a GET to an upstream service and returns its body as JSON.
// A successful exchange keeps the previous 200 OK contract even when the
// upstream reports an error status; transport failures become 502.
func (a *apiHandlers) proxy(w http.ResponseWriter, r *http.Request, base *url.URL, upstreamPath string, query url.Values) {
	target := *base
	target.Path = strings.TrimSuffix(base.Path, "/") + upstreamPath
	target.RawQuery = query.Encode()

	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, target.String(), nil)
	if err != nil {
		upstreamError(w, err)
		return
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "weather-service")

	resp, err := a.client.Do(req)
	if err != nil {
		upstreamError(w, err)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		upstreamError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(body)
}

func badRequest(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusBadRequest)
	_, _ = io.WriteString(w, message)
}

func upstreamError(w http.ResponseWriter, err error) {
	log.Printf("upstream request failed: %v", err)
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusBadGateway)
	_, _ = io.WriteString(w, "Upstream error")
}

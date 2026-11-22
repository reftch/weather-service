package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
)

func testRouter(t *testing.T, meteoURL, geocodeURL, photonURL string) http.Handler {
	t.Helper()
	h, err := newRouter(config{
		host:       "127.0.0.1",
		port:       8080,
		assetsPath: t.TempDir(),
		meteoAPI:   meteoURL,
		geocodeAPI: geocodeURL,
		photonAPI:  photonURL,
	})
	if err != nil {
		t.Fatalf("newRouter: %v", err)
	}
	return h
}

func TestGetCities(t *testing.T) {
	var gotPath string
	var gotQuery map[string][]string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath, gotQuery = r.URL.Path, r.URL.Query()
		_, _ = io.WriteString(w, `{"results":[{"id":123,"name":"London","latitude":2.5,"longitude":1.5,"feature_code":"PPLC","country_code":"GB","country":"United Kingdom","admin1":"England","postcodes":["SW1"]}]}`)
	}))
	defer upstream.Close()

	rec := httptest.NewRecorder()
	testRouter(t, "", upstream.URL, "").ServeHTTP(rec,
		httptest.NewRequest(http.MethodGet, "/api/v1/cities?keyword=London", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if gotPath != "/v1/search" {
		t.Errorf("upstream path = %q, want /v1/search", gotPath)
	}
	want := map[string][]string{
		"name":     {"London"},
		"count":    {"10"},
		"language": {"en"},
		"format":   {"json"},
	}
	if !reflect.DeepEqual(gotQuery, want) {
		t.Errorf("upstream query = %v, want %v", gotQuery, want)
	}
	wantBody := `{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[1.5,2.5]},"properties":{"osm_id":123,"name":"London","state":"England","country":"United Kingdom","countrycode":"GB","type":"PPLC","postcode":"SW1"}}]}`
	if got := rec.Body.String(); got != wantBody {
		t.Errorf("body = %q, want %q", got, wantBody)
	}
	if got := rec.Header().Get("Content-Type"); got != "application/json" {
		t.Errorf("content type = %q", got)
	}
}

func TestGetCitiesNoResults(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = io.WriteString(w, `{}`)
	}))
	defer upstream.Close()

	rec := httptest.NewRecorder()
	testRouter(t, "", upstream.URL, "").ServeHTTP(rec,
		httptest.NewRequest(http.MethodGet, "/api/v1/cities?keyword=Nowhere", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if got, want := rec.Body.String(), `{"type":"FeatureCollection","features":[]}`; got != want {
		t.Errorf("body = %q, want %q", got, want)
	}
}

func TestGetCitiesUpstreamFailure(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "rate limited", http.StatusTooManyRequests)
	}))
	defer upstream.Close()

	rec := httptest.NewRecorder()
	testRouter(t, "", upstream.URL, "").ServeHTTP(rec,
		httptest.NewRequest(http.MethodGet, "/api/v1/cities?keyword=London", nil))

	if rec.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want 502", rec.Code)
	}
}

func TestGetReverse(t *testing.T) {
	var gotPath string
	var gotQuery map[string][]string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath, gotQuery = r.URL.Path, r.URL.Query()
		_, _ = io.WriteString(w, `{"features":[{"type":"Feature","properties":{"name":"Berlin"}}]}`)
	}))
	defer upstream.Close()

	rec := httptest.NewRecorder()
	testRouter(t, "", "", upstream.URL).ServeHTTP(rec,
		httptest.NewRequest(http.MethodGet, "/api/v1/reverse?lat=1.5&lon=-2.5", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if gotPath != "/reverse" {
		t.Errorf("upstream path = %q, want /reverse", gotPath)
	}
	want := map[string][]string{"lat": {"1.5"}, "lon": {"-2.5"}}
	if !reflect.DeepEqual(gotQuery, want) {
		t.Errorf("upstream query = %v, want %v", gotQuery, want)
	}
}

func TestGetTemperature(t *testing.T) {
	var gotPath string
	var gotQuery map[string][]string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath, gotQuery = r.URL.Path, r.URL.Query()
		_, _ = io.WriteString(w, `{"current":{"temperature_2m":12}}`)
	}))
	defer upstream.Close()

	rec := httptest.NewRecorder()
	testRouter(t, upstream.URL, "", "").ServeHTTP(rec,
		httptest.NewRequest(http.MethodGet, "/api/v1/temperature?latidude=1.5&longtitude=-2.5", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if gotPath != "/v1/forecast" {
		t.Errorf("upstream path = %q, want /v1/forecast", gotPath)
	}
	want := map[string][]string{
		"latitude":      {"1.5"},
		"longitude":     {"-2.5"},
		"forecast_days": {"10"},
		"timezone":      {"auto"},
		"current":       {"temperature_2m", "weather_code", "wind_speed_10m", "cloud_cover"},
		"hourly":        {"temperature_2m,precipitation_probability,wind_speed_10m,cloud_cover"},
		"daily":         {"temperature_2m_max,temperature_2m_min,sunrise,sunset,weather_code,precipitation_sum,wind_speed_10m_max"},
	}
	if !reflect.DeepEqual(gotQuery, want) {
		t.Errorf("upstream query = %v, want %v", gotQuery, want)
	}
	if got := rec.Body.String(); got != `{"current":{"temperature_2m":12}}` {
		t.Errorf("body = %q", got)
	}
}

func TestMissingParameters(t *testing.T) {
	tests := []struct{ path, message string }{
		{"/api/v1/cities", "Missing keyword"},
		{"/api/v1/reverse?lat=1", "Missing longtitude"},
		{"/api/v1/temperature?latidude=1", "Missing longtitude"},
		{"/api/v1/temperature?longtitude=1", "Missing latidude"},
	}
	router := testRouter(t, "", "", "")
	for _, tt := range tests {
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, tt.path, nil))
		if rec.Code != http.StatusBadRequest {
			t.Errorf("%s: status = %d, want 400", tt.path, rec.Code)
		}
		if got := rec.Body.String(); got != tt.message {
			t.Errorf("%s: body = %q, want %q", tt.path, got, tt.message)
		}
	}
}

func TestUpstreamFailure(t *testing.T) {
	upstream := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}))
	upstreamURL := upstream.URL
	upstream.Close()

	rec := httptest.NewRecorder()
	testRouter(t, upstreamURL, "", "").ServeHTTP(rec,
		httptest.NewRequest(http.MethodGet, "/api/v1/temperature?latidude=1&longtitude=2", nil))

	if rec.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want 502", rec.Code)
	}
}

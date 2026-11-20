package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
)

func testRouter(t *testing.T, meteoURL, photonURL string) http.Handler {
	t.Helper()
	h, err := newRouter(config{
		host:       "127.0.0.1",
		port:       8080,
		assetsPath: t.TempDir(),
		meteoAPI:   meteoURL,
		photonAPI:  photonURL,
	})
	if err != nil {
		t.Fatalf("newRouter: %v", err)
	}
	return h
}

func TestGetCities(t *testing.T) {
	var gotPath, gotQuery string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath, gotQuery = r.URL.Path, r.URL.RawQuery
		_, _ = io.WriteString(w, `{"features":[]}`)
	}))
	defer upstream.Close()

	rec := httptest.NewRecorder()
	testRouter(t, "", upstream.URL).ServeHTTP(rec,
		httptest.NewRequest(http.MethodGet, "/api/v1/cities?keyword=London", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if gotPath != "/api/" || gotQuery != "q=London" {
		t.Errorf("upstream request = %s?%s, want /api/?q=London", gotPath, gotQuery)
	}
	if got := rec.Body.String(); got != `{"features":[]}` {
		t.Errorf("body = %q", got)
	}
	if got := rec.Header().Get("Content-Type"); got != "application/json" {
		t.Errorf("content type = %q", got)
	}
}

func TestGetReverse(t *testing.T) {
	var gotPath string
	var gotQuery map[string][]string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath, gotQuery = r.URL.Path, r.URL.Query()
		_, _ = io.WriteString(w, `{"features":[]}`)
	}))
	defer upstream.Close()

	rec := httptest.NewRecorder()
	testRouter(t, "", upstream.URL).ServeHTTP(rec,
		httptest.NewRequest(http.MethodGet, "/api/v1/reverse?lat=1.5&lon=-2.5", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	if gotPath != "/reverse" {
		t.Errorf("upstream path = %q, want /reverse", gotPath)
	}
	if want := map[string][]string{"lat": {"1.5"}, "lon": {"-2.5"}}; !reflect.DeepEqual(gotQuery, want) {
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
	testRouter(t, upstream.URL, "").ServeHTTP(rec,
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
	router := testRouter(t, "", "")
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
	testRouter(t, upstreamURL, "").ServeHTTP(rec,
		httptest.NewRequest(http.MethodGet, "/api/v1/temperature?latidude=1&longtitude=2", nil))

	if rec.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want 502", rec.Code)
	}
}

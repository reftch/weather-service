package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestStaticAssets(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("<h1>weather</h1>"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(dir, "assets"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "assets", "app.js"), []byte("const a = 1;"), 0o644); err != nil {
		t.Fatal(err)
	}

	handler := staticHandler(dir)
	tests := []struct {
		path, contentType, body string
		status                  int
	}{
		{"/", "text/html; charset=utf-8", "<h1>weather</h1>", http.StatusOK},
		{"/assets/app.js", "text/javascript; charset=utf-8", "const a = 1;", http.StatusOK},
		{"/missing.txt", "text/plain; charset=utf-8", "Not Found", http.StatusNotFound},
		{"/../go.mod", "text/plain; charset=utf-8", "Not Found", http.StatusNotFound},
	}

	for _, tt := range tests {
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, tt.path, nil))
		if rec.Code != tt.status {
			t.Errorf("%s: status = %d, want %d", tt.path, rec.Code, tt.status)
		}
		if got := rec.Header().Get("Content-Type"); got != tt.contentType {
			t.Errorf("%s: content type = %q, want %q", tt.path, got, tt.contentType)
		}
		if got := rec.Body.String(); got != tt.body {
			t.Errorf("%s: body = %q, want %q", tt.path, got, tt.body)
		}
		if tt.status == http.StatusOK {
			if got := rec.Header().Get("Cache-Control"); got != "public, max-age=3600" {
				t.Errorf("%s: cache control = %q", tt.path, got)
			}
			if got := rec.Header().Get("ETag"); !strings.HasPrefix(got, `"`) {
				t.Errorf("%s: etag = %q", tt.path, got)
			}
			if got := rec.Header().Get("Last-Modified"); got == "" {
				t.Errorf("%s: missing last-modified", tt.path)
			}
		}
	}
}

func TestStaticNotModified(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte("hi"), 0o644); err != nil {
		t.Fatal(err)
	}

	handler := staticHandler(dir)
	first := httptest.NewRecorder()
	handler.ServeHTTP(first, httptest.NewRequest(http.MethodGet, "/", nil))
	etag := first.Header().Get("ETag")

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("If-None-Match", etag)
	second := httptest.NewRecorder()
	handler.ServeHTTP(second, req)
	if second.Code != http.StatusNotModified {
		t.Fatalf("status = %d, want 304", second.Code)
	}
}

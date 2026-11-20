package main

import (
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
)

var extraMIMETypes = map[string]string{
	".css":  "text/css; charset=utf-8",
	".html": "text/html; charset=utf-8",
	".js":   "text/javascript; charset=utf-8",
	".json": "application/json",
	".mjs":  "text/javascript; charset=utf-8",
	".svg":  "image/svg+xml",
	".wasm": "application/wasm",
}

// staticHandler serves the built frontend, using index.html when a directory
// is requested. It mirrors the caching headers of the previous Rust server.
func staticHandler(assetsDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			w.Header().Set("Allow", "GET, HEAD")
			http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
			return
		}

		for _, segment := range strings.Split(r.URL.Path, "/") {
			if segment == ".." {
				writeNotFound(w)
				return
			}
		}

		clean := path.Clean("/" + r.URL.Path)
		if clean == "/" {
			clean = "/index.html"
		}
		full := filepath.Join(assetsDir, filepath.FromSlash(strings.TrimPrefix(clean, "/")))

		info, err := os.Stat(full)
		if err == nil && info.IsDir() {
			full = filepath.Join(full, "index.html")
			info, err = os.Stat(full)
		}
		if err != nil || !info.Mode().IsRegular() {
			writeNotFound(w)
			return
		}

		file, err := os.Open(full)
		if err != nil {
			writeNotFound(w)
			return
		}
		defer file.Close()

		modTime := info.ModTime().UTC()
		etag := fmt.Sprintf("\"%x-%x\"", modTime.Unix(), info.Size())
		w.Header().Set("Content-Type", contentType(full))
		w.Header().Set("Cache-Control", "public, max-age=3600")
		w.Header().Set("ETag", etag)
		w.Header().Set("Last-Modified", modTime.Format(http.TimeFormat))

		if r.Header.Get("If-None-Match") == etag {
			w.WriteHeader(http.StatusNotModified)
			return
		}
		http.ServeContent(w, r, info.Name(), modTime, file)
	}
}

func contentType(name string) string {
	ext := strings.ToLower(filepath.Ext(name))
	if ct, ok := extraMIMETypes[ext]; ok {
		return ct
	}
	if ct := mime.TypeByExtension(ext); ct != "" {
		return ct
	}
	return "application/octet-stream"
}

func writeNotFound(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.WriteHeader(http.StatusNotFound)
	_, _ = io.WriteString(w, "Not Found")
}

package handlers

import (
	"encoding/json"
	"net/http"
)

func notImplemented(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"message": "not implemented",
		"path":    r.URL.Path,
		"method":  r.Method,
	})
}

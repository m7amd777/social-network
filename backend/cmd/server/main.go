package main

import (
	"log"
	"net/http"

	"social-network/internal/db/sqlite"
)

func main() {
	db, err := sqlite.Open("./social-network.db")
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()

	if err := sqlite.RunMigrations("./social-network.db", "./internal/db/migrations/sqlite"); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	log.Println("server starting on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

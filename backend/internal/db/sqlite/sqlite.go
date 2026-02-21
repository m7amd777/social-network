package sqlite

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"

	_ "github.com/mattn/go-sqlite3"
)

func Open(dbPath string) (*sql.DB, error) {
	absPath, err := filepath.Abs(dbPath)
	if err != nil {
		return nil, fmt.Errorf("resolve db path: %w", err)
	}

	db, err := sql.Open("sqlite3", absPath)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		return nil, fmt.Errorf("enable foreign keys: %w", err)
	}

	return db, nil
}

// RunMigrations reads .up.sql files from the migrationsPath directory
// and executes them against the database, tracking applied versions
// in a schema_migrations table.
func RunMigrations(db *sql.DB, migrationsPath string) error {
	absPath, err := filepath.Abs(migrationsPath)
	if err != nil {
		return fmt.Errorf("resolve migrations path: %w", err)
	}

	// Create migrations tracking table
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		version INTEGER PRIMARY KEY,
		dirty INTEGER NOT NULL DEFAULT 0
	)`)
	if err != nil {
		return fmt.Errorf("create schema_migrations table: %w", err)
	}

	// Find all .up.sql files
	files, err := filepath.Glob(filepath.Join(absPath, "*.up.sql"))
	if err != nil {
		return fmt.Errorf("glob migration files: %w", err)
	}
	sort.Strings(files)

	for _, file := range files {
		// Extract version number from filename (e.g. 000001 from 000001_init_schema.up.sql)
		base := filepath.Base(file)
		var version int
		if _, err := fmt.Sscanf(base, "%d", &version); err != nil {
			return fmt.Errorf("parse version from %s: %w", base, err)
		}

		// Check if already applied
		var count int
		err := db.QueryRow("SELECT COUNT(*) FROM schema_migrations WHERE version = ?", version).Scan(&count)
		if err != nil {
			return fmt.Errorf("check migration version %d: %w", version, err)
		}
		if count > 0 {
			continue
		}

		// Read and execute migration
		sqlBytes, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("read migration file %s: %w", base, err)
		}

		if _, err := db.Exec(string(sqlBytes)); err != nil {
			return fmt.Errorf("execute migration %s: %w", base, err)
		}

		// Record applied migration
		if _, err := db.Exec("INSERT INTO schema_migrations (version) VALUES (?)", version); err != nil {
			return fmt.Errorf("record migration %d: %w", version, err)
		}

		log.Printf("applied migration: %s", base)
	}

	log.Println("migrations applied successfully")
	return nil
}

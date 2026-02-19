package db

import (
	"database/sql"
	"fmt"

	"social-network/internal/db/sqlite"
)

var DB *sql.DB

func Init(dbPath, migrationsPath string) error {
	dbConn, err := sqlite.Open(dbPath)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	if err := sqlite.RunMigrations(dbPath, migrationsPath); err != nil {
		_ = dbConn.Close()
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	DB = dbConn
	return nil
}

func Close() error {
	if DB == nil {
		return nil
	}

	err := DB.Close()
	DB = nil
	return err
}

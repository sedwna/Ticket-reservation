package db

import (
	"database/sql"
	"fmt"
	"os"
	_ "github.com/jackc/pgx/v5/stdlib"
)

func NewDBFromEnv() (*sql.DB, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return nil, fmt.Errorf("DATABASE_URL not set")
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}
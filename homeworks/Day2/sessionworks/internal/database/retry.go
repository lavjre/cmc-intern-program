package database

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq" // PostgreSQL driver
)

func ConnectWithRetry(dsn string, maxRetries int) (*sql.DB, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}

	for attempt := 1; attempt <= maxRetries; attempt++ {
		log.Printf("🔄 Database connection attempt %d/%d...", attempt, maxRetries)

		if err = db.Ping(); err == nil {
			log.Println("✅ Database connected successfully!")
			return db, nil
		}

		if attempt < maxRetries {
			sleepSec := 1 << uint(attempt-1)
			log.Printf("⚠️  Connection failed: %v. Retrying in %ds...", err, sleepSec)
			time.Sleep(time.Duration(sleepSec) * time.Second)
		}
	}

	_ = db.Close()
	return nil, fmt.Errorf("failed to connect to database after %d attempts: %w", maxRetries, err)
}

// bai 4

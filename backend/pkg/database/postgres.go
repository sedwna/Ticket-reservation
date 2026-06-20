package database

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"ticket-reservation-system/config"
	"ticket-reservation-system/internal/models"
)

func Connect(cfg *config.Config) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)

	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Connected to PostgreSQL database successfully")
	return db, nil
}

func Migrate(db *gorm.DB) error {
	log.Println("Running database migrations...")

	err := db.AutoMigrate(
		&models.User{},
		&models.Event{},
		&models.Seat{},
		&models.Reservation{},
		&models.AuditLog{},
	)
	if err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	log.Println("Database migrations completed successfully")
	return nil
}

func SeedAdmin(db *gorm.DB) error {
	var count int64
	db.Model(&models.User{}).Where("role = ?", "ADMIN").Count(&count)
	if count > 0 {
		return nil
	}

	admin := &models.User{
		StudentID:   "ADMIN001",
		FirstName:   "مدیر",
		LastName:    "سامانه",
		Email:       "admin@basu.ac.ir",
		PasswordHash: "$2a$10$dummyhashwillbesetproperly",
		Role:        "ADMIN",
		IsActive:    true,
	}

	// Set proper password hash for "REMOVED_SECRET"
	admin.PasswordHash = ""
	admin.SetPassword("REMOVED_SECRET")

	if err := db.Create(admin).Error; err != nil {
		return fmt.Errorf("failed to seed admin user: %w", err)
	}

	log.Println("Admin user seeded successfully (admin@basu.ac.ir / REMOVED_SECRET)")
	return nil
}

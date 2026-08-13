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

	if err := migrateEmailIntegrity(db); err != nil {
		return fmt.Errorf("failed to migrate email integrity: %w", err)
	}
	if err := migrateRegistrationConstraints(db); err != nil {
		return fmt.Errorf("failed to migrate registration constraints: %w", err)
	}

	log.Println("Database migrations completed successfully")
	return nil
}

func migrateRegistrationConstraints(db *gorm.DB) error {
	return db.Exec(`
		CREATE OR REPLACE FUNCTION enforce_user_registration_fields()
		RETURNS TRIGGER AS $$
		BEGIN
			IF NEW.role = 'USER' THEN
				IF NEW.student_id !~ '^[0-9]{10,20}$' THEN
					RAISE EXCEPTION 'student_id must contain 10 to 20 digits'
						USING ERRCODE = '23514';
				END IF;

				IF SPLIT_PART(LOWER(BTRIM(NEW.email)), '@', 2) <> 'gmail.com' THEN
					RAISE EXCEPTION 'user email must use the gmail.com domain'
						USING ERRCODE = '23514';
				END IF;
			END IF;

			RETURN NEW;
		END;
		$$ LANGUAGE plpgsql;

		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1
				FROM pg_trigger
				WHERE tgname = 'users_registration_fields_before_insert'
				  AND tgrelid = 'users'::regclass
			) THEN
				CREATE TRIGGER users_registration_fields_before_insert
				BEFORE INSERT ON users
				FOR EACH ROW
				EXECUTE FUNCTION enforce_user_registration_fields();
			END IF;
		END $$;
	`).Error
}

const databaseEmailPredicate = `
	LENGTH(email) BETWEEN 3 AND 254
	AND email = LOWER(BTRIM(email))
	AND email NOT LIKE '%..%'
	AND LENGTH(SPLIT_PART(email, '@', 1)) <= 64
	AND email ~ '^[a-z0-9.!#$%&''*+/=?^_{|}~-]+@[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'`

func migrateEmailIntegrity(db *gorm.DB) error {
	var duplicateGroups int64
	if err := db.Raw(`
		SELECT COUNT(*)
		FROM (
			SELECT LOWER(BTRIM(email)) AS normalized_email
			FROM users
			GROUP BY LOWER(BTRIM(email))
			HAVING COUNT(*) > 1
		) duplicates
	`).Scan(&duplicateGroups).Error; err != nil {
		return err
	}
	if duplicateGroups > 0 {
		return fmt.Errorf("found %d case-insensitive duplicate email group(s); resolve them before starting the server", duplicateGroups)
	}

	if err := db.Exec(`
		UPDATE users
		SET email = LOWER(BTRIM(email)), updated_at = NOW()
		WHERE email <> LOWER(BTRIM(email))
	`).Error; err != nil {
		return err
	}

	if err := db.Exec(`
		CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_normalized
		ON users (LOWER(email))
	`).Error; err != nil {
		return err
	}

	var invalidLegacyUsers int64
	if err := db.Raw(`SELECT COUNT(*) FROM users WHERE NOT (` + databaseEmailPredicate + `)`).Scan(&invalidLegacyUsers).Error; err != nil {
		return err
	}
	if invalidLegacyUsers > 0 {
		if err := db.Exec(`UPDATE users SET is_active = FALSE WHERE NOT (` + databaseEmailPredicate + `)`).Error; err != nil {
			return err
		}
		log.Printf("Warning: deactivated %d legacy user(s) with invalid email structure", invalidLegacyUsers)
	}

	constraintSQL := `
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1
				FROM pg_constraint
				WHERE conname = 'users_email_integrity_check'
				  AND conrelid = 'users'::regclass
			) THEN
				ALTER TABLE users
				ADD CONSTRAINT users_email_integrity_check
				CHECK (` + databaseEmailPredicate + `) NOT VALID;
			END IF;
		END $$;
	`
	if err := db.Exec(constraintSQL).Error; err != nil {
		return err
	}
	if invalidLegacyUsers > 0 {
		return nil
	}

	return db.Exec(`ALTER TABLE users VALIDATE CONSTRAINT users_email_integrity_check`).Error
}

func SeedAdmin(db *gorm.DB) error {
	var count int64
	db.Model(&models.User{}).Where("role = ?", "ADMIN").Count(&count)
	if count > 0 {
		return nil
	}

	admin := &models.User{
		StudentID:    "ADMIN001",
		FirstName:    "مدیر",
		LastName:     "سامانه",
		Email:        "admin@basu.ac.ir",
		PasswordHash: "$2a$10$dummyhashwillbesetproperly",
		Role:         "ADMIN",
		IsActive:     true,
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

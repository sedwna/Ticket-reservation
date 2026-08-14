package database

import (
	"errors"
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
	if err := migrateReservationStatusConstraint(db); err != nil {
		return fmt.Errorf("failed to migrate reservation status constraint: %w", err)
	}
	if err := migrateEventStatusConstraint(db); err != nil {
		return fmt.Errorf("failed to migrate event status constraint: %w", err)
	}

	log.Println("Database migrations completed successfully")
	return nil
}

func migrateEventStatusConstraint(db *gorm.DB) error {
	return db.Exec(`
		ALTER TABLE events DROP CONSTRAINT IF EXISTS chk_events_status;
		ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
		ALTER TABLE events
		ADD CONSTRAINT chk_events_status
		CHECK (status IN ('ACTIVE', 'CANCELLED', 'COMPLETED', 'CLOSED'));
	`).Error
}

func migrateReservationStatusConstraint(db *gorm.DB) error {
	return db.Exec(`
		ALTER TABLE reservations DROP CONSTRAINT IF EXISTS chk_reservations_status;
		ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
		ALTER TABLE reservations
		ADD CONSTRAINT chk_reservations_status
		CHECK (status IN ('ACTIVE', 'CANCELLED', 'COMPLETED'));
	`).Error
}

func migrateRegistrationConstraints(db *gorm.DB) error {
	const registrationPredicate = `
		student_id ~ '^[0-9]{10,20}$'
		AND SPLIT_PART(email, '@', 2) = 'gmail.com'`

	var invalidUsers int64
	if err := db.Raw(`SELECT COUNT(*) FROM users WHERE NOT (` + registrationPredicate + `)`).Scan(&invalidUsers).Error; err != nil {
		return err
	}
	if invalidUsers > 0 {
		return fmt.Errorf("found %d existing user(s) with a non-Gmail email or invalid student ID; run scripts/audit_user_data.sql and correct those records", invalidUsers)
	}

	return db.Exec(`
		CREATE OR REPLACE FUNCTION enforce_user_registration_fields()
		RETURNS TRIGGER AS $$
		BEGIN
			IF NEW.student_id !~ '^[0-9]{10,20}$' THEN
				RAISE EXCEPTION 'student_id must contain 10 to 20 digits'
					USING ERRCODE = '23514';
			END IF;

			IF NEW.email <> LOWER(BTRIM(NEW.email)) OR SPLIT_PART(NEW.email, '@', 2) <> 'gmail.com' THEN
				RAISE EXCEPTION 'email must be normalized and use the exact gmail.com domain'
					USING ERRCODE = '23514';
			END IF;

			RETURN NEW;
		END;
		$$ LANGUAGE plpgsql;

		DROP TRIGGER IF EXISTS users_registration_fields_before_insert ON users;
		DROP TRIGGER IF EXISTS users_registration_fields_before_write ON users;

		CREATE TRIGGER users_registration_fields_before_write
		BEFORE INSERT OR UPDATE OF student_id, email, role ON users
		FOR EACH ROW
		EXECUTE FUNCTION enforce_user_registration_fields();

		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1
				FROM pg_constraint
				WHERE conname = 'users_student_id_format_check'
				  AND conrelid = 'users'::regclass
			) THEN
				ALTER TABLE users
				ADD CONSTRAINT users_student_id_format_check
				CHECK (student_id ~ '^[0-9]{10,20}$');
			END IF;

			IF NOT EXISTS (
				SELECT 1
				FROM pg_constraint
				WHERE conname = 'users_gmail_domain_check'
				  AND conrelid = 'users'::regclass
			) THEN
				ALTER TABLE users
				ADD CONSTRAINT users_gmail_domain_check
				CHECK (email = LOWER(BTRIM(email)) AND SPLIT_PART(email, '@', 2) = 'gmail.com');
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
		return fmt.Errorf("found %d existing user(s) with an invalid email structure; run scripts/audit_user_data.sql and correct those records", invalidLegacyUsers)
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
	return db.Exec(`ALTER TABLE users VALIDATE CONSTRAINT users_email_integrity_check`).Error
}

func SeedAdmin(db *gorm.DB, cfg *config.Config) error {
	var existingAdmin models.User
	err := db.Where("LOWER(email) = ?", cfg.DemoAdminEmail).First(&existingAdmin).Error
	if err == nil {
		return nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return fmt.Errorf("failed to check default admin: %w", err)
	}

	admin := &models.User{
		StudentID:    cfg.DemoAdminStudentID,
		FirstName:    "مدیر",
		LastName:     "سامانه",
		Email:        cfg.DemoAdminEmail,
		PasswordHash: "$2a$10$dummyhashwillbesetproperly",
		Role:         "ADMIN",
		IsActive:     true,
	}

	admin.PasswordHash = ""
	if err := admin.SetPassword(cfg.DemoAdminPassword); err != nil {
		return fmt.Errorf("failed to hash default admin password: %w", err)
	}

	if err := db.Create(admin).Error; err != nil {
		return fmt.Errorf("failed to seed admin user: %w", err)
	}

	log.Printf("Demo admin user seeded successfully (%s)", cfg.DemoAdminEmail)
	return nil
}

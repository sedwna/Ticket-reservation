-- Enforce the registration rules for every existing and future account.
-- This migration deliberately fails instead of inventing an email or student ID.

DO $$
DECLARE
    invalid_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM users
    WHERE student_id !~ '^[0-9]{10,20}$'
       OR email <> LOWER(BTRIM(email))
       OR SPLIT_PART(email, '@', 2) <> 'gmail.com';

    IF invalid_count > 0 THEN
        RAISE EXCEPTION '% existing user record(s) are invalid. Run scripts/audit_user_data.sql and correct them first.', invalid_count;
    END IF;
END $$;

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
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_student_id_format_check'
          AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_student_id_format_check
            CHECK (student_id ~ '^[0-9]{10,20}$');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_gmail_domain_check'
          AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_gmail_domain_check
            CHECK (email = LOWER(BTRIM(email)) AND SPLIT_PART(email, '@', 2) = 'gmail.com');
    END IF;
END $$;

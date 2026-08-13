-- Enforce the registration rules for newly inserted USER accounts.
-- Existing records are intentionally preserved because their correct student IDs
-- and replacement Gmail addresses cannot be inferred safely.

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

-- Normalize existing email data and enforce case-insensitive uniqueness.
-- The script refuses to merge duplicate accounts because doing so could lose data.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM users
        GROUP BY LOWER(BTRIM(email))
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Case-insensitive duplicate emails exist. Resolve them before applying 002_email_integrity.';
    END IF;
END $$;

UPDATE users
SET email = LOWER(BTRIM(email)), updated_at = NOW()
WHERE email <> LOWER(BTRIM(email));

ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(254);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_normalized
    ON users (LOWER(email));

UPDATE users
SET is_active = FALSE
WHERE NOT (
    LENGTH(email) BETWEEN 3 AND 254
    AND email = LOWER(BTRIM(email))
    AND email NOT LIKE '%..%'
    AND LENGTH(SPLIT_PART(email, '@', 1)) <= 64
    AND email ~ '^[a-z0-9.!#$%&''*+/=?^_{|}~-]+@[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
);

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
            CHECK (
                LENGTH(email) BETWEEN 3 AND 254
                AND email = LOWER(BTRIM(email))
                AND email NOT LIKE '%..%'
                AND LENGTH(SPLIT_PART(email, '@', 1)) <= 64
                AND email ~ '^[a-z0-9.!#$%&''*+/=?^_{|}~-]+@[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
            ) NOT VALID;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM users
        WHERE NOT (
            LENGTH(email) BETWEEN 3 AND 254
            AND email = LOWER(BTRIM(email))
            AND email NOT LIKE '%..%'
            AND LENGTH(SPLIT_PART(email, '@', 1)) <= 64
            AND email ~ '^[a-z0-9.!#$%&''*+/=?^_{|}~-]+@[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$'
        )
    ) THEN
        ALTER TABLE users VALIDATE CONSTRAINT users_email_integrity_check;
    END IF;
END $$;

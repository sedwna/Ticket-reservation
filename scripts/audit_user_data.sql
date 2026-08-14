\set ON_ERROR_STOP on

-- Safe normalization: no identity is invented or replaced.
UPDATE users
SET email = LOWER(BTRIM(email)),
    student_id = BTRIM(student_id),
    updated_at = NOW()
WHERE email <> LOWER(BTRIM(email))
   OR student_id <> BTRIM(student_id);

SELECT
    id,
    student_id,
    email,
    role,
    is_active,
    CONCAT_WS(', ',
        CASE WHEN student_id !~ '^[0-9]{10,20}$'
             THEN 'student_id must contain 10 to 20 digits' END,
        CASE WHEN email !~ '^[a-z0-9.!#$%&''*+/=?^_{|}~-]+@gmail\.com$'
             THEN 'email must use the exact gmail.com domain' END
    ) AS validation_errors
FROM users
WHERE student_id !~ '^[0-9]{10,20}$'
   OR email !~ '^[a-z0-9.!#$%&''*+/=?^_{|}~-]+@gmail\.com$'
ORDER BY created_at, id;

DO $$
DECLARE
    invalid_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM users
    WHERE student_id !~ '^[0-9]{10,20}$'
       OR email !~ '^[a-z0-9.!#$%&''*+/=?^_{|}~-]+@gmail\.com$';

    IF invalid_count > 0 THEN
        RAISE EXCEPTION '% invalid user record(s) found. Correct the rows printed above; no value was fabricated automatically.', invalid_count;
    END IF;
END $$;

SELECT COUNT(*) AS valid_user_records FROM users;

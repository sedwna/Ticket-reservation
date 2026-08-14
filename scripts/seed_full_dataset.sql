\set ON_ERROR_STOP on

\if :{?demo_password}
\else
\echo 'demo_password must be supplied with psql -v demo_password=...'
\quit 3
\endif

-- Full synthetic production-like dataset for Ticket Reservation System.
-- All identities are fictional. Every email and student ID satisfies the app rules.
-- DATASET_COUNTS users=220 events_per_status=50 active_reservations=1000 completed_reservations=500 cancelled_reservations=500 audit_per_action=50
-- The password is supplied at runtime through the psql demo_password variable.
-- Safe to run repeatedly: only records owned by this deterministic dataset are replaced.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TEMP TABLE seed_expectations (
    user_count INTEGER NOT NULL,
    event_count INTEGER NOT NULL,
    event_status_count INTEGER NOT NULL,
    active_reservation_count INTEGER NOT NULL,
    completed_reservation_count INTEGER NOT NULL,
    cancelled_reservation_count INTEGER NOT NULL,
    audit_per_action INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_expectations VALUES (220, 200, 50, 1000, 500, 500, 50);

CREATE OR REPLACE FUNCTION pg_temp.coverage_uuid(seed_text TEXT)
RETURNS UUID
LANGUAGE SQL
IMMUTABLE
STRICT
AS $$
    SELECT (
        substr(md5(seed_text), 1, 8) || '-' ||
        substr(md5(seed_text), 9, 4) || '-' ||
        substr(md5(seed_text), 13, 4) || '-' ||
        substr(md5(seed_text), 17, 4) || '-' ||
        substr(md5(seed_text), 21, 12)
    )::uuid;
$$;

-- Remove only the previous copy of this dataset; user-created rows are preserved.
DELETE FROM audit_logs
WHERE details->>'source' = 'full-coverage-dataset'
   OR id IN (
       SELECT pg_temp.coverage_uuid('coverage-audit-' || i)
       FROM generate_series(1, 250) AS g(i)
   );

DELETE FROM reservations
WHERE event_id IN (
    SELECT pg_temp.coverage_uuid('coverage-event-' || i)
    FROM generate_series(1, 200) AS g(i)
);

DELETE FROM seats
WHERE event_id IN (
    SELECT pg_temp.coverage_uuid('coverage-event-' || i)
    FROM generate_series(1, 200) AS g(i)
);

DELETE FROM events
WHERE id IN (
    SELECT pg_temp.coverage_uuid('coverage-event-' || i)
    FROM generate_series(1, 200) AS g(i)
);

-- 220 fictional but realistic-looking users: 50 admins, 120 active users and 50 inactive users.
WITH name_lists AS (
    SELECT
        ARRAY[
            'نگار','امیرحسین','مریم','علی','زهرا','محمد','فاطمه','سینا','سارا','رضا',
            'نازنین','پارسا','هانیه','آرمان','مهسا','کیان','یلدا','مهدی','پرنیا','عرفان',
            'آیدا','سامان','شبنم','پویا','الناز','نسترن','حسین','پریسا','کاوه','مینا'
        ]::TEXT[] AS first_names,
        ARRAY[
            'احمدی','کریمی','جعفری','محمدی','حسینی','رضایی','مرادی','اکبری','قاسمی','صادقی',
            'نوری','موسوی','کاظمی','یوسفی','طاهری','عباسی','رحیمی','زارعی','نجفی','امینی',
            'سلیمانی','خلیلی','بهرامی','رستمی','حیدری','علوی','نصیری','کمالی','شمس','آقایی'
        ]::TEXT[] AS last_names
), password_seed AS (
    SELECT crypt(:'demo_password', gen_salt('bf', 10)) AS password_hash
), user_source AS (
    SELECT
        i,
        names.first_names[((i - 1) % array_length(names.first_names, 1)) + 1] AS first_name,
        names.last_names[((i - 1) % array_length(names.last_names, 1)) + 1] AS last_name
    FROM generate_series(1, (SELECT user_count FROM seed_expectations)) AS g(i)
    CROSS JOIN name_lists AS names
)
INSERT INTO users (
    id, student_id, first_name, last_name, email, password_hash,
    role, is_active, created_at, updated_at
)
SELECT
    pg_temp.coverage_uuid('coverage-user-' || source.i),
    (4100000000::BIGINT + source.i)::TEXT,
    source.first_name,
    source.last_name,
    'ticket.reservation.demo+full.user' || lpad(source.i::TEXT, 3, '0') || '@gmail.com',
    password.password_hash,
    CASE WHEN source.i <= 50 THEN 'ADMIN' ELSE 'USER' END,
    source.i <= 170,
    NOW() - make_interval(days => ((220 - source.i) % 180)),
    NOW()
FROM user_source AS source
CROSS JOIN password_seed AS password
ON CONFLICT (id) DO UPDATE SET
    student_id = EXCLUDED.student_id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 200 events: exactly 50 ACTIVE, 50 CLOSED, 50 COMPLETED and 50 CANCELLED.
WITH event_lists AS (
    SELECT
        ARRAY[
            'همایش هوش مصنوعی در صنعت','کارگاه توسعه وب مدرن','شب شعر و موسیقی دانشجویی',
            'نشست مسیر شغلی مهندسان نرم‌افزار','کارگاه امنیت سایبری و هک اخلاقی',
            'دفاع پایان‌نامه‌های برتر','جشن فارغ‌التحصیلی دانشکده','مسابقه ارائه سه دقیقه‌ای پژوهش',
            'سمینار انرژی‌های تجدیدپذیر','رویداد ایده‌پردازی شهر هوشمند','کارگاه طراحی تجربه کاربری',
            'نشست فرصت‌های تحصیل در مقطع دکتری','مسترکلاس تحلیل داده با پایتون',
            'بازدید آزمایشگاه رباتیک','دوره اصول ارائه علمی','نشست کارآفرینی و جذب سرمایه',
            'کارگاه اینترنت اشیا','همایش مهندسی پزشکی','نمایش تئاتر دانشجویی','مسابقات برنامه‌نویسی',
            'نشست سواد رسانه‌ای','کارگاه نگارش مقاله علمی','سمینار رایانش ابری','جشنواره فیلم کوتاه',
            'کارگاه مدیریت پروژه چابک'
        ]::TEXT[] AS titles,
        ARRAY[
            'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=80',
            'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80'
        ]::TEXT[] AS posters
), event_source AS (
    SELECT
        i,
        lists.titles[((i - 1) % array_length(lists.titles, 1)) + 1] AS base_title,
        lists.posters[((i - 1) % array_length(lists.posters, 1)) + 1] AS poster_url,
        CASE
            WHEN i <= 50 THEN 'ACTIVE'
            WHEN i <= 100 THEN 'CLOSED'
            WHEN i <= 150 THEN 'COMPLETED'
            ELSE 'CANCELLED'
        END AS status
    FROM generate_series(1, (SELECT event_count FROM seed_expectations)) AS g(i)
    CROSS JOIN event_lists AS lists
)
INSERT INTO events (
    id, title, description, event_date, start_time, end_time,
    total_capacity, poster_url, status, created_by, created_at, updated_at
)
SELECT
    pg_temp.coverage_uuid('coverage-event-' || source.i),
    source.base_title || ' — دوره ' || source.i,
    'رویداد واقعی‌نمای شماره ' || source.i ||
        ' برای پوشش جستجو، فیلتر، ظرفیت، گزارش‌گیری، رزرو و مدیریت وضعیت در سامانه.',
    CASE
        WHEN source.status IN ('ACTIVE', 'CLOSED')
            THEN CURRENT_DATE + (((source.i - 1) % 25) + 1)
        WHEN source.status = 'COMPLETED'
            THEN CURRENT_DATE - (((source.i - 101) % 50) + 1)
        ELSE CURRENT_DATE + (((source.i - 151) % 30) + 2)
    END,
    (ARRAY['08:00','09:00','10:30','13:00','14:30','16:00','18:00'])[((source.i - 1) % 7) + 1],
    (ARRAY['10:00','11:30','13:00','15:00','17:00','19:00','21:00'])[((source.i - 1) % 7) + 1],
    80 + (((source.i - 1) % 5) * 16),
    source.poster_url,
    source.status,
    pg_temp.coverage_uuid('coverage-user-' || (((source.i - 1) % 50) + 1)),
    NOW() - make_interval(days => (source.i % 120)),
    NOW()
FROM event_source AS source;

-- More than 20,000 seats; the first two rows of every event are VIP.
WITH event_source AS (
    SELECT i AS event_no, 80 + (((i - 1) % 5) * 16) AS capacity
    FROM generate_series(1, (SELECT event_count FROM seed_expectations)) AS g(i)
)
INSERT INTO seats (
    id, event_id, row_number, seat_number, seat_label, seat_type, status, created_at
)
SELECT
    pg_temp.coverage_uuid('coverage-seat-' || event.event_no || '-' || seat_no),
    pg_temp.coverage_uuid('coverage-event-' || event.event_no),
    ((seat_no - 1) / 8) + 1,
    ((seat_no - 1) % 8) + 1,
    chr(64 + (((seat_no - 1) / 8) + 1)) || (((seat_no - 1) % 8) + 1)::TEXT,
    CASE WHEN seat_no <= 16 THEN 'VIP' ELSE 'REGULAR' END,
    'AVAILABLE',
    NOW() - make_interval(days => (event.event_no % 120))
FROM event_source AS event
CROSS JOIN LATERAL generate_series(1, event.capacity) AS seats_for_event(seat_no);

-- 1,000 active reservations across ACTIVE and CLOSED events (10 per event).
WITH assignments AS (
    SELECT
        i,
        ((i - 1) / 10) + 1 AS event_no,
        ((i - 1) % 10) + 1 AS slot_no
    FROM generate_series(1, (SELECT active_reservation_count FROM seed_expectations)) AS g(i)
), resolved AS (
    SELECT
        assignment.*,
        51 + ((assignment.event_no * 13 + assignment.slot_no * 7) % 120) AS user_no
    FROM assignments AS assignment
)
INSERT INTO reservations (
    id, user_id, event_id, seat_id, status, reserved_at, cancelled_at
)
SELECT
    pg_temp.coverage_uuid('coverage-active-reservation-' || item.i),
    pg_temp.coverage_uuid('coverage-user-' || item.user_no),
    pg_temp.coverage_uuid('coverage-event-' || item.event_no),
    pg_temp.coverage_uuid('coverage-seat-' || item.event_no || '-' || item.slot_no),
    'ACTIVE',
    CASE
        WHEN item.i <= 50
            THEN date_trunc('day', NOW()) + make_interval(mins => item.i * 5)
        ELSE NOW()
            - make_interval(days => ((item.i - 51) % 60))
            - make_interval(hours => ((item.i * 17) % 24))
    END,
    NULL
FROM resolved AS item;

-- 500 completed reservations across all COMPLETED events (10 per event).
WITH assignments AS (
    SELECT
        i,
        101 + ((i - 1) / 10) AS event_no,
        ((i - 1) % 10) + 1 AS slot_no
    FROM generate_series(1, (SELECT completed_reservation_count FROM seed_expectations)) AS g(i)
), resolved AS (
    SELECT
        assignment.*,
        51 + ((assignment.event_no * 19 + assignment.slot_no * 11) % 120) AS user_no
    FROM assignments AS assignment
)
INSERT INTO reservations (
    id, user_id, event_id, seat_id, status, reserved_at, cancelled_at
)
SELECT
    pg_temp.coverage_uuid('coverage-completed-reservation-' || item.i),
    pg_temp.coverage_uuid('coverage-user-' || item.user_no),
    pg_temp.coverage_uuid('coverage-event-' || item.event_no),
    pg_temp.coverage_uuid('coverage-seat-' || item.event_no || '-' || item.slot_no),
    'COMPLETED',
    event.event_date - make_interval(days => (10 + item.slot_no)),
    NULL
FROM resolved AS item
JOIN events AS event ON event.id = pg_temp.coverage_uuid('coverage-event-' || item.event_no);

-- 500 cancelled reservations across all event statuses, including 50 cancelled today.
WITH assignments AS (
    SELECT
        i,
        ((i - 1) % 200) + 1 AS event_no,
        ((i - 1) / 200) AS occurrence_no
    FROM generate_series(1, (SELECT cancelled_reservation_count FROM seed_expectations)) AS g(i)
), resolved AS (
    SELECT
        assignment.*,
        41 + assignment.occurrence_no AS seat_rank,
        171 + ((assignment.event_no + assignment.occurrence_no * 11) % 50) AS user_no
    FROM assignments AS assignment
)
INSERT INTO reservations (
    id, user_id, event_id, seat_id, status, reserved_at, cancelled_at
)
SELECT
    pg_temp.coverage_uuid('coverage-cancelled-reservation-' || item.i),
    pg_temp.coverage_uuid('coverage-user-' || item.user_no),
    pg_temp.coverage_uuid('coverage-event-' || item.event_no),
    pg_temp.coverage_uuid('coverage-seat-' || item.event_no || '-' || item.seat_rank),
    'CANCELLED',
    NOW() - make_interval(days => (20 + (item.i % 120))),
    CASE
        WHEN item.i <= 50
            THEN date_trunc('day', NOW()) + make_interval(mins => item.i * 4)
        ELSE NOW() - make_interval(days => (item.i % 20))
    END
FROM resolved AS item;

-- Seat state reflects only reservations that still own a seat.
UPDATE seats AS seat
SET status = CASE
    WHEN EXISTS (
        SELECT 1
        FROM reservations AS reservation
        WHERE reservation.seat_id = seat.id
          AND reservation.status IN ('ACTIVE', 'COMPLETED')
    ) THEN 'RESERVED'
    ELSE 'AVAILABLE'
END
WHERE seat.event_id IN (
    SELECT pg_temp.coverage_uuid('coverage-event-' || i)
    FROM generate_series(1, 200) AS g(i)
);

-- 250 audit rows: exactly 50 examples for each supported admin action.
WITH audit_source AS (
    SELECT
        i,
        (ARRAY['CREATE_EVENT','UPDATE_EVENT','DELETE_EVENT','TOGGLE_USER','CHANGE_ROLE'])[((i - 1) % 5) + 1] AS action
    FROM generate_series(1, 250) AS g(i)
)
INSERT INTO audit_logs (
    id, admin_id, action, target_id, target_type, details, created_at
)
SELECT
    pg_temp.coverage_uuid('coverage-audit-' || source.i),
    pg_temp.coverage_uuid('coverage-user-' || (((source.i - 1) % 50) + 1)),
    source.action,
    CASE WHEN source.action IN ('TOGGLE_USER', 'CHANGE_ROLE')
        THEN pg_temp.coverage_uuid('coverage-user-' || (((source.i * 7) % 170) + 51))
        ELSE pg_temp.coverage_uuid('coverage-event-' || (((source.i - 1) % 200) + 1))
    END,
    CASE WHEN source.action IN ('TOGGLE_USER', 'CHANGE_ROLE') THEN 'USER' ELSE 'EVENT' END,
    jsonb_build_object(
        'source', 'full-coverage-dataset',
        'sequence', source.i,
        'action', source.action,
        'description', 'عملیات مدیریتی واقعی‌نما برای تست گزارش و تاریخچه'
    ),
    NOW() - make_interval(hours => ((250 - source.i) % 120))
FROM audit_source AS source;

-- Hard validation: any inconsistency aborts and rolls back the whole seed.
DO $$
DECLARE
    expected seed_expectations%ROWTYPE;
    actual BIGINT;
BEGIN
    SELECT * INTO expected FROM seed_expectations LIMIT 1;

    SELECT COUNT(*) INTO actual FROM users
    WHERE id IN (
        SELECT pg_temp.coverage_uuid('coverage-user-' || i)
        FROM generate_series(1, expected.user_count) AS g(i)
    );
    IF actual <> expected.user_count THEN
        RAISE EXCEPTION 'Dataset validation failed: expected % users, found %', expected.user_count, actual;
    END IF;

    IF (SELECT COUNT(*) FROM users WHERE role = 'ADMIN' AND id IN (
        SELECT pg_temp.coverage_uuid('coverage-user-' || i)
        FROM generate_series(1, expected.user_count) AS g(i)
    )) < 50 OR (SELECT COUNT(*) FROM users WHERE role = 'USER' AND id IN (
        SELECT pg_temp.coverage_uuid('coverage-user-' || i)
        FROM generate_series(1, expected.user_count) AS g(i)
    )) < 50 OR (SELECT COUNT(*) FROM users WHERE is_active = FALSE AND id IN (
        SELECT pg_temp.coverage_uuid('coverage-user-' || i)
        FROM generate_series(1, expected.user_count) AS g(i)
    )) < 50 THEN
        RAISE EXCEPTION 'Dataset validation failed: ADMIN, USER or inactive-user coverage is below 50';
    END IF;

    IF EXISTS (
        SELECT 1 FROM users
        WHERE id IN (
            SELECT pg_temp.coverage_uuid('coverage-user-' || i)
            FROM generate_series(1, expected.user_count) AS g(i)
        )
          AND (student_id !~ '^[0-9]{10,20}$' OR email !~ '^[a-z0-9.!#$%&''*+/=?^_{|}~-]+@gmail\.com$')
    ) THEN
        RAISE EXCEPTION 'Dataset validation failed: invalid email or student ID';
    END IF;

    SELECT COUNT(*) INTO actual FROM (
        SELECT status
        FROM events
        WHERE id IN (
            SELECT pg_temp.coverage_uuid('coverage-event-' || i)
            FROM generate_series(1, expected.event_count) AS g(i)
        )
        GROUP BY status
        HAVING COUNT(*) = expected.event_status_count
    ) AS valid_status_groups;
    IF actual <> 4 THEN
        RAISE EXCEPTION 'Dataset validation failed: every event status must have exactly % rows', expected.event_status_count;
    END IF;

    SELECT COUNT(*) INTO actual FROM seats
    WHERE event_id IN (
        SELECT pg_temp.coverage_uuid('coverage-event-' || i)
        FROM generate_series(1, expected.event_count) AS g(i)
    );
    IF actual <> (SELECT SUM(total_capacity) FROM events WHERE id IN (
        SELECT pg_temp.coverage_uuid('coverage-event-' || i)
        FROM generate_series(1, expected.event_count) AS g(i)
    )) THEN
        RAISE EXCEPTION 'Dataset validation failed: seat count does not match event capacity';
    END IF;

    IF (SELECT COUNT(*) FROM seats WHERE seat_type = 'VIP' AND event_id IN (
        SELECT pg_temp.coverage_uuid('coverage-event-' || i)
        FROM generate_series(1, expected.event_count) AS g(i)
    )) < 50 OR (SELECT COUNT(*) FROM seats WHERE seat_type = 'REGULAR' AND event_id IN (
        SELECT pg_temp.coverage_uuid('coverage-event-' || i)
        FROM generate_series(1, expected.event_count) AS g(i)
    )) < 50 THEN
        RAISE EXCEPTION 'Dataset validation failed: VIP and REGULAR seat coverage is insufficient';
    END IF;

    IF (SELECT COUNT(*) FROM reservations WHERE status = 'ACTIVE' AND id IN (
        SELECT pg_temp.coverage_uuid('coverage-active-reservation-' || i)
        FROM generate_series(1, expected.active_reservation_count) AS g(i)
    )) <> expected.active_reservation_count THEN
        RAISE EXCEPTION 'Dataset validation failed: active reservation count mismatch';
    END IF;

    IF (SELECT COUNT(*) FROM reservations WHERE status = 'COMPLETED' AND id IN (
        SELECT pg_temp.coverage_uuid('coverage-completed-reservation-' || i)
        FROM generate_series(1, expected.completed_reservation_count) AS g(i)
    )) <> expected.completed_reservation_count THEN
        RAISE EXCEPTION 'Dataset validation failed: completed reservation count mismatch';
    END IF;

    IF (SELECT COUNT(*) FROM reservations WHERE status = 'CANCELLED' AND cancelled_at IS NOT NULL AND id IN (
        SELECT pg_temp.coverage_uuid('coverage-cancelled-reservation-' || i)
        FROM generate_series(1, expected.cancelled_reservation_count) AS g(i)
    )) <> expected.cancelled_reservation_count THEN
        RAISE EXCEPTION 'Dataset validation failed: cancelled reservation count mismatch';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM reservations AS reservation
        JOIN seats AS seat ON seat.id = reservation.seat_id
        WHERE reservation.event_id <> seat.event_id
          AND reservation.event_id IN (
              SELECT pg_temp.coverage_uuid('coverage-event-' || i)
              FROM generate_series(1, expected.event_count) AS g(i)
          )
    ) THEN
        RAISE EXCEPTION 'Dataset validation failed: reservation points to a seat from another event';
    END IF;

    IF EXISTS (
        SELECT user_id, event_id
        FROM reservations
        WHERE event_id IN (
            SELECT pg_temp.coverage_uuid('coverage-event-' || i)
            FROM generate_series(1, expected.event_count) AS g(i)
        )
        GROUP BY user_id, event_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Dataset validation failed: duplicate user/event reservation';
    END IF;

    IF EXISTS (
        SELECT seat_id
        FROM reservations
        WHERE event_id IN (
            SELECT pg_temp.coverage_uuid('coverage-event-' || i)
            FROM generate_series(1, expected.event_count) AS g(i)
        )
        GROUP BY seat_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Dataset validation failed: duplicate seat reservation';
    END IF;

    SELECT COUNT(*) INTO actual FROM (
        SELECT action
        FROM audit_logs
        WHERE details->>'source' = 'full-coverage-dataset'
        GROUP BY action
        HAVING COUNT(*) = expected.audit_per_action
    ) AS valid_action_groups;
    IF actual <> 5 THEN
        RAISE EXCEPTION 'Dataset validation failed: every audit action must have exactly % rows', expected.audit_per_action;
    END IF;
END $$;

COMMIT;

-- Human-readable verification summary.
SELECT 'users' AS feature, COUNT(*) AS records
FROM users WHERE id IN (SELECT pg_temp.coverage_uuid('coverage-user-' || i) FROM generate_series(1, 220) AS g(i))
UNION ALL
SELECT 'events_active', COUNT(*) FROM events WHERE status = 'ACTIVE' AND id IN (SELECT pg_temp.coverage_uuid('coverage-event-' || i) FROM generate_series(1, 200) AS g(i))
UNION ALL
SELECT 'events_closed', COUNT(*) FROM events WHERE status = 'CLOSED' AND id IN (SELECT pg_temp.coverage_uuid('coverage-event-' || i) FROM generate_series(1, 200) AS g(i))
UNION ALL
SELECT 'events_completed', COUNT(*) FROM events WHERE status = 'COMPLETED' AND id IN (SELECT pg_temp.coverage_uuid('coverage-event-' || i) FROM generate_series(1, 200) AS g(i))
UNION ALL
SELECT 'events_cancelled', COUNT(*) FROM events WHERE status = 'CANCELLED' AND id IN (SELECT pg_temp.coverage_uuid('coverage-event-' || i) FROM generate_series(1, 200) AS g(i))
UNION ALL
SELECT 'seats_vip', COUNT(*) FROM seats WHERE seat_type = 'VIP' AND event_id IN (SELECT pg_temp.coverage_uuid('coverage-event-' || i) FROM generate_series(1, 200) AS g(i))
UNION ALL
SELECT 'seats_regular', COUNT(*) FROM seats WHERE seat_type = 'REGULAR' AND event_id IN (SELECT pg_temp.coverage_uuid('coverage-event-' || i) FROM generate_series(1, 200) AS g(i))
UNION ALL
SELECT 'reservations_active', COUNT(*) FROM reservations WHERE status = 'ACTIVE' AND id IN (SELECT pg_temp.coverage_uuid('coverage-active-reservation-' || i) FROM generate_series(1, 1000) AS g(i))
UNION ALL
SELECT 'reservations_completed', COUNT(*) FROM reservations WHERE status = 'COMPLETED' AND id IN (SELECT pg_temp.coverage_uuid('coverage-completed-reservation-' || i) FROM generate_series(1, 500) AS g(i))
UNION ALL
SELECT 'reservations_cancelled', COUNT(*) FROM reservations WHERE status = 'CANCELLED' AND id IN (SELECT pg_temp.coverage_uuid('coverage-cancelled-reservation-' || i) FROM generate_series(1, 500) AS g(i))
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs WHERE details->>'source' = 'full-coverage-dataset'
ORDER BY feature;

SELECT
    'مدیر دیتاست' AS account,
    'ticket.reservation.demo+full.user001@gmail.com' AS email
UNION ALL
SELECT 'کاربر فعال', 'ticket.reservation.demo+full.user051@gmail.com'
UNION ALL
SELECT 'کاربر غیرفعال', 'ticket.reservation.demo+full.user171@gmail.com';

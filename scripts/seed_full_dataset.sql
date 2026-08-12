-- Comprehensive demo dataset for Ticket Reservation System
-- Password for every demo account: REMOVED_SECRET
-- Safe to run repeatedly: only records created by this dataset are replaced.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Remove the previous copy of this dataset, preserving user-created records.
DELETE FROM audit_logs
WHERE id IN (
  SELECT (substr(md5('demo-audit-' || i), 1, 8) || '-' ||
          substr(md5('demo-audit-' || i), 9, 4) || '-' ||
          substr(md5('demo-audit-' || i), 13, 4) || '-' ||
          substr(md5('demo-audit-' || i), 17, 4) || '-' ||
          substr(md5('demo-audit-' || i), 21, 12))::uuid
  FROM generate_series(1, 25) AS g(i)
);

DELETE FROM reservations
WHERE event_id IN (
  SELECT (substr(md5('demo-event-' || i), 1, 8) || '-' || substr(md5('demo-event-' || i), 9, 4) || '-' ||
          substr(md5('demo-event-' || i), 13, 4) || '-' || substr(md5('demo-event-' || i), 17, 4) || '-' ||
          substr(md5('demo-event-' || i), 21, 12))::uuid
  FROM generate_series(1, 25) AS g(i)
)
OR id IN (
  SELECT (substr(md5(kind || i), 1, 8) || '-' || substr(md5(kind || i), 9, 4) || '-' ||
          substr(md5(kind || i), 13, 4) || '-' || substr(md5(kind || i), 17, 4) || '-' ||
          substr(md5(kind || i), 21, 12))::uuid
  FROM (VALUES ('demo-active-reservation-'), ('demo-cancelled-reservation-')) AS k(kind)
  CROSS JOIN generate_series(1, 25) AS g(i)
);

DELETE FROM seats
WHERE event_id IN (
  SELECT (substr(md5('demo-event-' || i), 1, 8) || '-' || substr(md5('demo-event-' || i), 9, 4) || '-' ||
          substr(md5('demo-event-' || i), 13, 4) || '-' || substr(md5('demo-event-' || i), 17, 4) || '-' ||
          substr(md5('demo-event-' || i), 21, 12))::uuid
  FROM generate_series(1, 25) AS g(i)
);

DELETE FROM events
WHERE id IN (
  SELECT (substr(md5('demo-event-' || i), 1, 8) || '-' || substr(md5('demo-event-' || i), 9, 4) || '-' ||
          substr(md5('demo-event-' || i), 13, 4) || '-' || substr(md5('demo-event-' || i), 17, 4) || '-' ||
          substr(md5('demo-event-' || i), 21, 12))::uuid
  FROM generate_series(1, 25) AS g(i)
);

-- 25 realistic users: 3 admins, 19 active users and 3 inactive users.
WITH user_data(i, student_id, first_name, last_name, email, role, is_active) AS (
  VALUES
    (1,  'ADMIN1001', 'نگار',   'احمدی',       'negar.ahmadi@basu.ac.ir',       'ADMIN', true),
    (2,  'ADMIN1002', 'امیرحسین','کریمی',       'amir.karimi@basu.ac.ir',         'ADMIN', true),
    (3,  'ADMIN1003', 'مریم',    'جعفری',       'maryam.jafari@basu.ac.ir',       'ADMIN', true),
    (4,  '99121001',  'علی',     'محمدی',       'ali.mohammadi@student.basu.ac.ir','USER', true),
    (5,  '99121002',  'زهرا',    'حسینی',       'zahra.hosseini@student.basu.ac.ir','USER', true),
    (6,  '99121003',  'محمد',    'رضایی',       'mohammad.rezaei@student.basu.ac.ir','USER', true),
    (7,  '99121004',  'فاطمه',   'مرادی',       'fatemeh.moradi@student.basu.ac.ir','USER', true),
    (8,  '99121005',  'سینا',    'اکبری',       'sina.akbari@student.basu.ac.ir', 'USER', true),
    (9,  '99121006',  'سارا',    'قاسمی',       'sara.ghasemi@student.basu.ac.ir','USER', true),
    (10, '99121007',  'رضا',     'صادقی',       'reza.sadeghi@student.basu.ac.ir','USER', true),
    (11, '99121008',  'نازنین',  'نوری',        'nazanin.nouri@student.basu.ac.ir','USER', true),
    (12, '99121009',  'پارسا',   'موسوی',       'parsa.mousavi@student.basu.ac.ir','USER', true),
    (13, '99121010',  'هانیه',   'کاظمی',       'haniyeh.kazemi@student.basu.ac.ir','USER', true),
    (14, '99121011',  'آرمان',   'یوسفی',       'arman.yousefi@student.basu.ac.ir','USER', true),
    (15, '99121012',  'مهسا',    'طاهری',       'mahsa.taheri@student.basu.ac.ir','USER', true),
    (16, '99121013',  'کیان',    'عباسی',       'kian.abbasi@student.basu.ac.ir', 'USER', true),
    (17, '99121014',  'یلدا',    'رحیمی',       'yalda.rahimi@student.basu.ac.ir','USER', true),
    (18, '99121015',  'مهدی',    'زارعی',       'mahdi.zarei@student.basu.ac.ir', 'USER', true),
    (19, '99121016',  'پرنیا',   'نجفی',        'parnia.najafi@student.basu.ac.ir','USER', true),
    (20, '99121017',  'عرفان',   'امینی',       'erfan.amini@student.basu.ac.ir', 'USER', true),
    (21, '99121018',  'آیدا',    'سلیمانی',     'ayda.soleimani@student.basu.ac.ir','USER', true),
    (22, '99121019',  'سامان',   'خلیلی',       'saman.khalili@student.basu.ac.ir','USER', true),
    (23, '98121020',  'شبنم',    'بهرامی',      'shabnam.bahrami@student.basu.ac.ir','USER', false),
    (24, '98121021',  'پویا',    'رستمی',       'pouya.rostami@student.basu.ac.ir','USER', false),
    (25, '98121022',  'الناز',   'حیدری',       'elnaz.heydari@student.basu.ac.ir','USER', false)
)
INSERT INTO users (id, student_id, first_name, last_name, email, password_hash, role, is_active, created_at, updated_at)
SELECT
  (substr(md5('demo-user-' || i), 1, 8) || '-' || substr(md5('demo-user-' || i), 9, 4) || '-' ||
   substr(md5('demo-user-' || i), 13, 4) || '-' || substr(md5('demo-user-' || i), 17, 4) || '-' ||
   substr(md5('demo-user-' || i), 21, 12))::uuid,
  student_id, first_name, last_name, email, crypt('REMOVED_SECRET', gen_salt('bf', 10)), role, is_active,
  NOW() - ((26 - i) || ' days')::interval, NOW()
FROM user_data
ON CONFLICT (id) DO UPDATE SET
  student_id = EXCLUDED.student_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 25 events covering ACTIVE, CLOSED, COMPLETED and CANCELLED states.
WITH event_data(i, title, description, day_offset, start_time, end_time, capacity, status, poster_url) AS (
  VALUES
    (1,  'همایش هوش مصنوعی در صنعت',              'ارائه تجربه شرکت‌های ایرانی در استفاده عملی از یادگیری ماشین و مدل‌های زبانی.',             3,  '09:00','12:00',60,'ACTIVE',''),
    (2,  'کارگاه مقدماتی React',                   'ساخت یک رابط کاربری واقعی با کامپوننت‌ها، هوک‌ها و مدیریت وضعیت.',                            5,  '14:00','18:00',48,'ACTIVE',''),
    (3,  'شب شعر و موسیقی دانشجویی',               'اجرای شعرخوانی، موسیقی زنده و معرفی استعدادهای هنری دانشگاه.',                              7,  '17:00','20:00',72,'ACTIVE',''),
    (4,  'نشست مسیر شغلی مهندسان نرم‌افزار',       'گفت‌وگو با فارغ‌التحصیلان درباره رزومه، مصاحبه فنی و ورود به بازار کار.',                    9,  '10:00','13:00',60,'ACTIVE',''),
    (5,  'کارگاه امنیت سایبری و هک اخلاقی',        'آشنایی عملی با امنیت وب، تهدیدهای رایج و اصول تست نفوذ مجاز.',                              12, '08:30','16:30',40,'ACTIVE',''),
    (6,  'دفاع پایان‌نامه‌های برتر دانشکده',        'ارائه پایان‌نامه‌های منتخب رشته‌های کامپیوتر، برق، عمران و مکانیک.',                         15, '08:00','14:00',72,'ACTIVE',''),
    (7,  'جشن فارغ‌التحصیلی دانشکده مهندسی',       'مراسم تقدیر از دانش‌آموختگان همراه با سخنرانی، عکس گروهی و اجرای هنری.',                    18, '16:00','20:30',60,'ACTIVE',''),
    (8,  'مسابقه ارائه سه دقیقه‌ای پژوهش',          'دانشجویان پژوهش خود را در سه دقیقه برای هیئت داوران و مخاطبان ارائه می‌کنند.',               21, '13:00','17:00',48,'ACTIVE',''),
    (9,  'سمینار انرژی‌های تجدیدپذیر',              'بررسی فناوری خورشیدی و بادی و فرصت‌های پژوهشی انرژی پاک در ایران.',                         24, '09:30','12:30',60,'ACTIVE',''),
    (10, 'رویداد ایده‌پردازی شهر هوشمند',           'تشکیل تیم و طراحی راه‌حل برای حمل‌ونقل، انرژی و خدمات شهری هوشمند.',                        27, '08:00','19:00',48,'ACTIVE',''),
    (11, 'کارگاه طراحی تجربه کاربری',               'پژوهش کاربر، طراحی وایرفریم و آزمون کاربردپذیری روی یک محصول نمونه.',                       30, '14:00','18:00',40,'ACTIVE',''),
    (12, 'نشست فرصت‌های تحصیل در مقطع دکتری',       'راهنمای انتخاب دانشگاه، مکاتبه علمی، پروپوزال و دریافت حمایت پژوهشی.',                      34, '10:00','12:30',60,'ACTIVE',''),
    (13, 'مسترکلاس تحلیل داده با پایتون',           'ظرفیت ثبت‌نام تکمیل شده؛ آموزش پاک‌سازی، تحلیل و مصورسازی داده‌های واقعی.',                  6,  '09:00','17:00',40,'CLOSED',''),
    (14, 'بازدید مجازی از آزمایشگاه رباتیک',        'ثبت‌نام بسته شده؛ معرفی ربات‌های صنعتی، بینایی ماشین و پروژه‌های دانشجویی.',                 11, '15:00','17:00',48,'CLOSED',''),
    (15, 'دوره فشرده اصول ارائه علمی',              'ثبت‌نام پایان یافته؛ تمرین ساخت اسلاید و ارائه مؤثر برای دفاع و کنفرانس.',                   17, '09:00','13:00',40,'CLOSED',''),
    (16, 'نشست کارآفرینی و جذب سرمایه',             'ثبت‌نام بسته شده؛ بررسی مدل کسب‌وکار، ارائه به سرمایه‌گذار و تجربه بنیان‌گذاران.',           23, '16:00','19:00',60,'CLOSED',''),
    (17, 'آیین روز مهندس',                          'مراسم برگزارشده با تقدیر از استادان و دانشجویان برگزیده دانشکده.',                         -3,  '15:00','19:00',72,'COMPLETED',''),
    (18, 'کارگاه Git و همکاری تیمی',                'کارگاه برگزارشده درباره شاخه‌ها، Pull Request، حل تعارض و بازبینی کد.',                    -7,  '09:00','15:00',48,'COMPLETED',''),
    (19, 'سمینار اینترنت اشیا',                     'رویداد برگزارشده درباره حسگرها، پروتکل‌ها و کاربردهای اینترنت اشیا صنعتی.',                -12,  '10:00','13:00',60,'COMPLETED',''),
    (20, 'نمایشگاه پروژه‌های دانشجویی',             'نمایشگاه برگزارشده پروژه‌های درس‌های طراحی مهندسی و پروژه پایانی.',                        -18,  '08:30','16:00',72,'COMPLETED',''),
    (21, 'اردوی علمی نیروگاه خورشیدی',              'به دلیل نامساعد بودن شرایط جوی لغو شد.',                                                    4,  '07:00','18:00',40,'CANCELLED',''),
    (22, 'سخنرانی اقتصاد دیجیتال',                  'به دلیل تغییر برنامه سخنران لغو شد.',                                                       10, '14:00','16:00',60,'CANCELLED',''),
    (23, 'مسابقه برنامه‌نویسی دانشکده',             'به دلیل هم‌زمانی با امتحانات میان‌ترم لغو شد.',                                             16, '08:00','18:00',48,'CANCELLED',''),
    (24, 'کارگاه چاپ سه‌بعدی',                      'به دلیل تعمیر تجهیزات آزمایشگاه لغو شد.',                                                  22, '09:00','14:00',40,'CANCELLED',''),
    (25, 'نشست بین‌المللی مهندسی زلزله',            'به دلیل عدم امکان حضور مهمانان خارجی لغو شد.',                                             29, '09:00','13:00',72,'CANCELLED','')
)
INSERT INTO events (id, title, description, event_date, start_time, end_time, total_capacity, poster_url, status, created_by, created_at, updated_at)
SELECT
  (substr(md5('demo-event-' || i), 1, 8) || '-' || substr(md5('demo-event-' || i), 9, 4) || '-' ||
   substr(md5('demo-event-' || i), 13, 4) || '-' || substr(md5('demo-event-' || i), 17, 4) || '-' ||
   substr(md5('demo-event-' || i), 21, 12))::uuid,
  title, description, CURRENT_DATE + day_offset, start_time, end_time, capacity, poster_url, status,
  (substr(md5('demo-user-' || (((i - 1) % 3) + 1)), 1, 8) || '-' ||
   substr(md5('demo-user-' || (((i - 1) % 3) + 1)), 9, 4) || '-' ||
   substr(md5('demo-user-' || (((i - 1) % 3) + 1)), 13, 4) || '-' ||
   substr(md5('demo-user-' || (((i - 1) % 3) + 1)), 17, 4) || '-' ||
   substr(md5('demo-user-' || (((i - 1) % 3) + 1)), 21, 12))::uuid,
  NOW() - ((26 - i) || ' days')::interval, NOW()
FROM event_data;

-- Generate the exact capacity for every event, with VIP seats in the first row.
WITH demo_events AS (
  SELECT e.*, row_number() OVER (ORDER BY e.created_at, e.id) AS event_no
  FROM events e
  WHERE e.id IN (
    SELECT (substr(md5('demo-event-' || i), 1, 8) || '-' || substr(md5('demo-event-' || i), 9, 4) || '-' ||
            substr(md5('demo-event-' || i), 13, 4) || '-' || substr(md5('demo-event-' || i), 17, 4) || '-' ||
            substr(md5('demo-event-' || i), 21, 12))::uuid
    FROM generate_series(1, 25) AS g(i)
  )
)
INSERT INTO seats (id, event_id, row_number, seat_number, seat_label, seat_type, status, created_at)
SELECT
  (substr(md5('demo-seat-' || event_no || '-' || n), 1, 8) || '-' ||
   substr(md5('demo-seat-' || event_no || '-' || n), 9, 4) || '-' ||
   substr(md5('demo-seat-' || event_no || '-' || n), 13, 4) || '-' ||
   substr(md5('demo-seat-' || event_no || '-' || n), 17, 4) || '-' ||
   substr(md5('demo-seat-' || event_no || '-' || n), 21, 12))::uuid,
  id,
  ((n - 1) / 8) + 1,
  ((n - 1) % 8) + 1,
  chr(64 + (((n - 1) / 8) + 1)::int) || (((n - 1) % 8) + 1)::text,
  CASE WHEN n <= 8 THEN 'VIP' ELSE 'REGULAR' END,
  'AVAILABLE',
  NOW()
FROM demo_events
CROSS JOIN LATERAL generate_series(1, demo_events.total_capacity) AS s(n);

-- 25 active reservations distributed over 12 active events and the last 7 days.
WITH assignments AS (
  SELECT i,
         ((i - 1) % 12) + 1 AS event_no,
         ((i - 1) % 19) + 4 AS user_no,
         ((i - 1) / 12) + 1 AS seat_rank
  FROM generate_series(1, 25) AS g(i)
), resolved AS (
  SELECT a.*,
    (SELECT id FROM events WHERE id = (substr(md5('demo-event-' || a.event_no),1,8)||'-'||substr(md5('demo-event-' || a.event_no),9,4)||'-'||substr(md5('demo-event-' || a.event_no),13,4)||'-'||substr(md5('demo-event-' || a.event_no),17,4)||'-'||substr(md5('demo-event-' || a.event_no),21,12))::uuid) AS event_id,
    (substr(md5('demo-user-' || a.user_no),1,8)||'-'||substr(md5('demo-user-' || a.user_no),9,4)||'-'||substr(md5('demo-user-' || a.user_no),13,4)||'-'||substr(md5('demo-user-' || a.user_no),17,4)||'-'||substr(md5('demo-user-' || a.user_no),21,12))::uuid AS user_id
  FROM assignments a
)
INSERT INTO reservations (id, user_id, event_id, seat_id, status, reserved_at, cancelled_at)
SELECT
  (substr(md5('demo-active-reservation-'||i),1,8)||'-'||substr(md5('demo-active-reservation-'||i),9,4)||'-'||substr(md5('demo-active-reservation-'||i),13,4)||'-'||substr(md5('demo-active-reservation-'||i),17,4)||'-'||substr(md5('demo-active-reservation-'||i),21,12))::uuid,
  user_id, event_id,
  (SELECT s.id FROM seats s WHERE s.event_id = r.event_id ORDER BY s.row_number, s.seat_number OFFSET (seat_rank - 1) LIMIT 1),
  'ACTIVE', NOW() - (((i - 1) % 7) || ' days')::interval - ((i % 10) || ' hours')::interval, NULL
FROM resolved r;

-- 25 cancelled reservations, useful for history, filters and CSV reports.
WITH assignments AS (
  SELECT i,
         ((i + 11) % 25) + 1 AS event_no,
         ((i + 9) % 22) + 4 AS user_no,
         20 + (((i - 1) / 25)) AS seat_offset
  FROM generate_series(1, 25) AS g(i)
), resolved AS (
  SELECT a.*,
    (substr(md5('demo-event-' || a.event_no),1,8)||'-'||substr(md5('demo-event-' || a.event_no),9,4)||'-'||substr(md5('demo-event-' || a.event_no),13,4)||'-'||substr(md5('demo-event-' || a.event_no),17,4)||'-'||substr(md5('demo-event-' || a.event_no),21,12))::uuid AS event_id,
    (substr(md5('demo-user-' || a.user_no),1,8)||'-'||substr(md5('demo-user-' || a.user_no),9,4)||'-'||substr(md5('demo-user-' || a.user_no),13,4)||'-'||substr(md5('demo-user-' || a.user_no),17,4)||'-'||substr(md5('demo-user-' || a.user_no),21,12))::uuid AS user_id
  FROM assignments a
)
INSERT INTO reservations (id, user_id, event_id, seat_id, status, reserved_at, cancelled_at)
SELECT
  (substr(md5('demo-cancelled-reservation-'||i),1,8)||'-'||substr(md5('demo-cancelled-reservation-'||i),9,4)||'-'||substr(md5('demo-cancelled-reservation-'||i),13,4)||'-'||substr(md5('demo-cancelled-reservation-'||i),17,4)||'-'||substr(md5('demo-cancelled-reservation-'||i),21,12))::uuid,
  user_id, event_id,
  (SELECT s.id FROM seats s WHERE s.event_id = r.event_id ORDER BY s.row_number, s.seat_number OFFSET seat_offset LIMIT 1),
  'CANCELLED', NOW() - ((10 + (i % 15)) || ' days')::interval,
  NOW() - ((2 + (i % 8)) || ' days')::interval
FROM resolved r;

-- Synchronize seat status only with active reservations.
UPDATE seats s
SET status = 'RESERVED'
WHERE EXISTS (
  SELECT 1 FROM reservations r
  WHERE r.seat_id = s.id AND r.status = 'ACTIVE'
);

-- 25 audit entries covering all five supported admin actions.
WITH audit_data AS (
  SELECT i,
    (ARRAY['CREATE_EVENT','UPDATE_EVENT','TOGGLE_USER','CHANGE_ROLE','DELETE_EVENT'])[((i - 1) % 5) + 1] AS action,
    CASE WHEN ((i - 1) % 5) IN (2,3) THEN 'USER' ELSE 'EVENT' END AS target_type
  FROM generate_series(1, 25) AS g(i)
)
INSERT INTO audit_logs (id, admin_id, action, target_id, target_type, details, created_at)
SELECT
  (substr(md5('demo-audit-'||i),1,8)||'-'||substr(md5('demo-audit-'||i),9,4)||'-'||substr(md5('demo-audit-'||i),13,4)||'-'||substr(md5('demo-audit-'||i),17,4)||'-'||substr(md5('demo-audit-'||i),21,12))::uuid,
  (substr(md5('demo-user-' || (((i - 1) % 3) + 1)),1,8)||'-'||substr(md5('demo-user-' || (((i - 1) % 3) + 1)),9,4)||'-'||substr(md5('demo-user-' || (((i - 1) % 3) + 1)),13,4)||'-'||substr(md5('demo-user-' || (((i - 1) % 3) + 1)),17,4)||'-'||substr(md5('demo-user-' || (((i - 1) % 3) + 1)),21,12))::uuid,
  action,
  CASE WHEN target_type = 'USER'
    THEN (substr(md5('demo-user-' || (((i + 3) % 22) + 4)),1,8)||'-'||substr(md5('demo-user-' || (((i + 3) % 22) + 4)),9,4)||'-'||substr(md5('demo-user-' || (((i + 3) % 22) + 4)),13,4)||'-'||substr(md5('demo-user-' || (((i + 3) % 22) + 4)),17,4)||'-'||substr(md5('demo-user-' || (((i + 3) % 22) + 4)),21,12))::uuid
    ELSE (substr(md5('demo-event-' || (((i - 1) % 25) + 1)),1,8)||'-'||substr(md5('demo-event-' || (((i - 1) % 25) + 1)),9,4)||'-'||substr(md5('demo-event-' || (((i - 1) % 25) + 1)),13,4)||'-'||substr(md5('demo-event-' || (((i - 1) % 25) + 1)),17,4)||'-'||substr(md5('demo-event-' || (((i - 1) % 25) + 1)),21,12))::uuid
  END,
  target_type,
  jsonb_build_object('source','comprehensive-demo-dataset','sequence',i,'description','عملیات نمونه مدیریتی'),
  NOW() - ((25 - i) || ' hours')::interval
FROM audit_data;

COMMIT;

-- Quick verification summary
SELECT 'users' AS entity, COUNT(*) AS records
FROM users
WHERE id IN (SELECT (substr(md5('demo-user-'||i),1,8)||'-'||substr(md5('demo-user-'||i),9,4)||'-'||substr(md5('demo-user-'||i),13,4)||'-'||substr(md5('demo-user-'||i),17,4)||'-'||substr(md5('demo-user-'||i),21,12))::uuid FROM generate_series(1,25) g(i))
UNION ALL
SELECT 'events', COUNT(*) FROM events WHERE id IN (SELECT (substr(md5('demo-event-'||i),1,8)||'-'||substr(md5('demo-event-'||i),9,4)||'-'||substr(md5('demo-event-'||i),13,4)||'-'||substr(md5('demo-event-'||i),17,4)||'-'||substr(md5('demo-event-'||i),21,12))::uuid FROM generate_series(1,25) g(i))
UNION ALL SELECT 'seats', COUNT(*) FROM seats WHERE event_id IN (SELECT (substr(md5('demo-event-'||i),1,8)||'-'||substr(md5('demo-event-'||i),9,4)||'-'||substr(md5('demo-event-'||i),13,4)||'-'||substr(md5('demo-event-'||i),17,4)||'-'||substr(md5('demo-event-'||i),21,12))::uuid FROM generate_series(1,25) g(i))
UNION ALL SELECT 'active_reservations', COUNT(*) FROM reservations WHERE status='ACTIVE' AND id IN (SELECT (substr(md5('demo-active-reservation-'||i),1,8)||'-'||substr(md5('demo-active-reservation-'||i),9,4)||'-'||substr(md5('demo-active-reservation-'||i),13,4)||'-'||substr(md5('demo-active-reservation-'||i),17,4)||'-'||substr(md5('demo-active-reservation-'||i),21,12))::uuid FROM generate_series(1,25) g(i))
UNION ALL SELECT 'cancelled_reservations', COUNT(*) FROM reservations WHERE status='CANCELLED' AND id IN (SELECT (substr(md5('demo-cancelled-reservation-'||i),1,8)||'-'||substr(md5('demo-cancelled-reservation-'||i),9,4)||'-'||substr(md5('demo-cancelled-reservation-'||i),13,4)||'-'||substr(md5('demo-cancelled-reservation-'||i),17,4)||'-'||substr(md5('demo-cancelled-reservation-'||i),21,12))::uuid FROM generate_series(1,25) g(i))
UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs WHERE details->>'source'='comprehensive-demo-dataset';

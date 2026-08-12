const http = require('http');

const events = [
  {
    title: "سمینار تخصصی هوش مصنوعی و آینده پژوهش",
    description: "بررسی آخرین دستاوردهای هوش مصنوعی در حوزه پژوهش‌های دانشگاهی، کاربردهای ChatGPT و مدل‌های زبانی بزرگ در تحقیقات علمی، چالش‌های اخلاقی و فرصت‌های پیش رو برای دانشجویان تحصیلات تکمیلی. با حضور اساتید برجسته دانشکده مهندسی.",
    event_date: "2026-07-05", start_time: "09:00", end_time: "12:00", total_capacity: 60,
    row_config: [
      {row_number:1,seats:6,seat_type:"VIP"},{row_number:2,seats:10,seat_type:"VIP"},
      {row_number:3,seats:12,seat_type:"REGULAR"},{row_number:4,seats:12,seat_type:"REGULAR"},
      {row_number:5,seats:15,seat_type:"REGULAR"},{row_number:6,seats:15,seat_type:"REGULAR"}
    ]
  },
  {
    title: "کارگاه عملی React و توسعه وب مدرن",
    description: "کارگاه یک‌روزه آموزش عملی React ۱۹، Next.js و Tailwind CSS. مباحث شامل Server Components، مدیریت state با Zustand، و ساخت یک پروژه واقعی از صفر تا deploy.",
    event_date: "2026-07-12", start_time: "14:00", end_time: "18:00", total_capacity: 50,
    row_config: [
      {row_number:1,seats:8,seat_type:"REGULAR"},{row_number:2,seats:10,seat_type:"REGULAR"},
      {row_number:3,seats:10,seat_type:"REGULAR"},{row_number:4,seats:10,seat_type:"REGULAR"},
      {row_number:5,seats:12,seat_type:"REGULAR"}
    ]
  },
  {
    title: "جلسه دفاع از پایان‌نامه‌های برتر دانشکده",
    description: "ارائه و دفاع از پایان‌نامه‌های برتر مقطع کارشناسی ارشد در رشته‌های مهندسی کامپیوتر، برق و عمران.",
    event_date: "2026-07-20", start_time: "08:30", end_time: "13:00", total_capacity: 75,
    row_config: [
      {row_number:1,seats:8,seat_type:"VIP"},{row_number:2,seats:10,seat_type:"VIP"},
      {row_number:3,seats:13,seat_type:"REGULAR"},{row_number:4,seats:14,seat_type:"REGULAR"},
      {row_number:5,seats:15,seat_type:"REGULAR"},{row_number:6,seats:15,seat_type:"REGULAR"}
    ]
  },
  {
    title: "مراسم بزرگداشت روز دانشجو",
    description: "برنامه فرهنگی و هنری به مناسبت روز دانشجو با اجرای موسیقی زنده، نمایش طنز دانشجویی و تقدیر از دانشجویان ممتاز.",
    event_date: "2026-08-05", start_time: "16:00", end_time: "20:00", total_capacity: 80,
    row_config: [
      {row_number:1,seats:8,seat_type:"VIP"},{row_number:2,seats:12,seat_type:"VIP"},
      {row_number:3,seats:15,seat_type:"REGULAR"},{row_number:4,seats:15,seat_type:"REGULAR"},
      {row_number:5,seats:15,seat_type:"REGULAR"},{row_number:6,seats:15,seat_type:"REGULAR"}
    ]
  },
  {
    title: "دوره آموزشی امنیت سایبری و هک اخلاقی",
    description: "کارگاه دو روزه آشنایی با مبانی امنیت شبکه، تست نفوذ، مهندسی اجتماعی و راهکارهای محافظت از داده‌ها.",
    event_date: "2026-08-15", start_time: "09:00", end_time: "17:00", total_capacity: 40,
    row_config: [
      {row_number:1,seats:6,seat_type:"VIP"},{row_number:2,seats:8,seat_type:"REGULAR"},
      {row_number:3,seats:8,seat_type:"REGULAR"},{row_number:4,seats:9,seat_type:"REGULAR"},
      {row_number:5,seats:9,seat_type:"REGULAR"}
    ]
  }
];

const usersToCreate = [
  { student_id: '98123456', first_name: 'رضا', last_name: 'رضایی', email: 'user1@basu.ac.ir', password: 'userpass1' },
  { student_id: '98123457', first_name: 'سارا', last_name: 'محمدی', email: 'user2@basu.ac.ir', password: 'userpass2' },
];

function request(opts, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : '';
    const o = {
      hostname: 'localhost', port: 8080, method: opts.method || 'GET',
      path: opts.path,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    if (opts.token) o.headers['Authorization'] = 'Bearer ' + opts.token;

    const req = http.request(o, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // Ensure demo users exist (register if not)
  for (const u of usersToCreate) {
    try {
      const reg = await request({ method: 'POST', path: '/api/v1/auth/register' }, { student_id: u.student_id, first_name: u.first_name, last_name: u.last_name, email: u.email, password: u.password });
      console.log(`Registered user ${u.email}: ${reg.message || 'ok'}`);
    } catch (e) {
      console.log(`Register skipped/failed for ${u.email}:`, e.message || e);
    }
  }

  // Login as admin (the backend seeds admin on startup if missing)
  let token = null;
  try {
    const loginResp = await request(
      { method: 'POST', path: '/api/v1/auth/login' },
      { email: 'admin@basu.ac.ir', password: 'REMOVED_SECRET' }
    );
    token = loginResp.data.token;
    console.log('Logged in as admin.');
  } catch (err) {
    console.error('Failed to login as admin. Make sure the backend is running and migrations have run.');
    throw err;
  }

  // Clean existing events (delete all)
  const existingEvents = await request(
    { method: 'GET', path: '/api/v1/events', token }
  );
  const existingIds = (existingEvents.data || []).map(e => {
    console.log('Deleting old event: ' + e.title);
    return request({ method: 'DELETE', path: '/api/v1/admin/events/' + e.id, token });
  });
  await Promise.all(existingIds);
  console.log('Old events cleaned.');

  // Seed new events
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const result = await request(
      { method: 'POST', path: '/api/v1/admin/events', token },
      ev
    );
    console.log(`${i + 1}/5: ${ev.title} — ${result.message || 'created'}`);
  }

  // Verify
  const allEvents = await request(
    { method: 'GET', path: '/api/v1/events', token }
  );
  console.log('\n═══ Seeded Events ═══');
  (allEvents.data || []).forEach(e => {
    console.log(`  ${e.event_date} | ${e.total_capacity} seats | ${e.title}`);
  });
  console.log('══════════════════════');

  // Create a few reservations for demo users
  const createdEvents = allEvents.data || [];
  for (const u of usersToCreate) {
    try {
      const login = await request({ method: 'POST', path: '/api/v1/auth/login' }, { email: u.email, password: u.password });
      const userToken = login.data.token;
      console.log(`Logged in as ${u.email}`);

      // For first two events, reserve first available seat
      for (let i = 0; i < Math.min(3, createdEvents.length); i++) {
        const ev = createdEvents[i];
        const seats = await request({ method: 'GET', path: `/api/v1/events/${ev.id}/seats`, token });
        const available = (seats.data || []).filter(s => s.status === 'AVAILABLE');
        if (available.length === 0) continue;
        const seat = available[0];
        try {
          const res = await request({ method: 'POST', path: '/api/v1/reservations', token: userToken }, { event_id: ev.id, seat_id: seat.id });
          console.log(`Reserved seat ${seat.seat_label} for ${u.email} on ${ev.title}`);
        } catch (e) {
          console.log(`Failed to reserve for ${u.email}:`, e.message || e);
        }
      }
    } catch (e) {
      console.log(`Skipping reservations for ${u.email}: login failed`);
    }
  }
}

main().catch(e => console.error('Error:', e));

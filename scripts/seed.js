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
  // Login as admin
  const loginResp = await request(
    { method: 'POST', path: '/api/v1/auth/login' },
    { email: 'admin@basu.ac.ir', password: 'REMOVED_SECRET' }
  );
  const token = loginResp.data.token;
  console.log('Logged in as admin.');

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
}

main().catch(e => console.error('Error:', e));

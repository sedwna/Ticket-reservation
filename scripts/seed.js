const http = require('http');

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function makeRowConfig(capacity) {
  const rows = [];
  let remaining = capacity;
  let row = 1;
  while (remaining > 0) {
    const size = Math.min(remaining, randInt(6, 16));
    rows.push({ row_number: row, seats: size, seat_type: row <= 2 ? 'VIP' : 'REGULAR' });
    remaining -= size;
    row += 1;
  }
  return rows;
}

const NUM_EVENTS = 25;
const NUM_USERS = 80;
const demoDataPassword = process.env.DEMO_DATA_PASSWORD || '';
const demoAdminEmail = process.env.DEMO_ADMIN_EMAIL || '';
const demoAdminPassword = process.env.DEMO_ADMIN_PASSWORD || '';

const sampleTitles = [
  'سمینار هوش مصنوعی در پژوهش‌های نوین', 'کارگاه عملی توسعه وب مدرن', 'جلسه دفاع پایان‌نامه‌های منتخب', 'جشن روز دانشجو',
  'دوره آموزشی امنیت سایبری', 'کنسرت گروه‌های دانشجویی', 'وبینار کارآفرینی و شتابدهی', 'نمایش تئاتر کوتاه دانشجویی',
  'کارگاه تجربه کاربری (UX)', 'همایش بین‌رشته‌ای علوم و فناوری', 'سمینار رباتیک و اتوماسیون', 'کارگاه داده‌کاوی پیشرفته'
];

const posters = [
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80',
];

// realistic Persian first/last names with simple latin handles
const firstNames = [
  { p: 'رضا', l: 'reza' }, { p: 'سارا', l: 'sara' }, { p: 'مهدی', l: 'mahdi' }, { p: 'محمد', l: 'mohammad' },
  { p: 'نسترن', l: 'nastaran' }, { p: 'علی', l: 'ali' }, { p: 'نگار', l: 'negar' }, { p: 'حسین', l: 'hossein' },
  { p: 'پریسا', l: 'parisa' }, { p: 'امیر', l: 'amir' }, { p: 'فرناز', l: 'farnaz' }, { p: 'کاوه', l: 'kaveh' },
  { p: 'مینا', l: 'mina' }, { p: 'نگین', l: 'negin' }, { p: 'علیرضا', l: 'alireza' }, { p: 'سلمان', l: 'salman' },
  { p: 'زیبا', l: 'ziba' }, { p: 'نرگس', l: 'narges' }, { p: 'امید', l: 'omid' }, { p: 'بهناز', l: 'behnaz' }
];

const lastNames = [
  { p: 'احمدی', l: 'ahmadi' }, { p: 'محمدی', l: 'mohammadi' }, { p: 'رضایی', l: 'rezaei' }, { p: 'کاظمی', l: 'kazemi' },
  { p: 'کریمی', l: 'karimi' }, { p: 'علوی', l: 'alavi' }, { p: 'سلیمانی', l: 'soleimani' }, { p: 'نصیری', l: 'nasiri' },
  { p: 'حیدری', l: 'heidari' }, { p: 'موسوی', l: 'mousavi' }, { p: 'کمالی', l: 'kamali' }, { p: 'مرادی', l: 'moradi' },
  { p: 'شمس', l: 'shams' }, { p: 'آقایی', l: 'aghaei' }, { p: 'برزویی', l: 'barzooei' }, { p: 'پاشایی', l: 'pashaei' }
];

const usersToCreate = Array.from({ length: NUM_USERS }).map((_, i) => {
  const fn = firstNames[i % firstNames.length];
  const ln = lastNames[i % lastNames.length];
  const idx = Math.floor(i / Math.max(1, firstNames.length)) + 1;
  const email = `ticket.reservation.demo+${fn.l}.${ln.l}${idx}@gmail.com`;
  return {
    student_id: `4012${(340 + i).toString().padStart(6,'0')}`,
    first_name: fn.p,
    last_name: ln.p,
    email,
    password: demoDataPassword,
  };
});

const events = Array.from({ length: NUM_EVENTS }).map((_, i) => {
  const title = sampleTitles[i % sampleTitles.length] + ` #${i + 1}`;
  const capacity = randInt(60, 220);
  const row_config = makeRowConfig(capacity);
  const date = new Date(2026, 6, 1 + i); // July-based dates
  const dateStr = date.toISOString().slice(0,10);
  return {
    title,
    description: `${title} — یک رویداد نمونه برای پر کردن دیتابیس و تست امکانات سامانه.`,
    event_date: dateStr,
    start_time: `${randInt(8,16)}:00`,
    end_time: `${randInt(17,22)}:00`,
    total_capacity: capacity,
    poster_url: posters[i % posters.length],
    row_config,
  };
});

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
      res.on('end', () => {
        try { resolve(JSON.parse(b)); } catch (e) { resolve({ success: false, raw: b }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  if (demoDataPassword.length < 12 || !demoAdminEmail || demoAdminPassword.length < 12) {
    throw new Error('DEMO_DATA_PASSWORD, DEMO_ADMIN_EMAIL, and DEMO_ADMIN_PASSWORD must be configured securely');
  }

  console.log('Seeding users...');
  for (const u of usersToCreate) {
    try {
      const reg = await request({ method: 'POST', path: '/api/v1/auth/register' }, { student_id: u.student_id, first_name: u.first_name, last_name: u.last_name, email: u.email, password: u.password });
      if (reg && reg.success) console.log(`Registered ${u.email}`);
      else console.log(`Register response for ${u.email}:`, reg.message || reg.raw || reg);
    } catch (e) { console.log(`Register failed for ${u.email}:`, e.message || e); }
  }

  // Login admin
  let adminToken;
  try {
    const loginResp = await request({ method: 'POST', path: '/api/v1/auth/login' }, { email: demoAdminEmail, password: demoAdminPassword });
    adminToken = loginResp.data.token;
    console.log('Admin logged in.');
  } catch (e) { console.error('Admin login failed — ensure backend running and migrations executed.'); throw e; }

  // Remove existing events
  try {
    const existingEvents = await request({ method: 'GET', path: '/api/v1/events', token: adminToken });
    const deletes = (existingEvents.data || []).map(e => request({ method: 'DELETE', path: '/api/v1/admin/events/' + e.id, token: adminToken }));
    await Promise.allSettled(deletes);
    console.log('Old events cleared.');
  } catch (e) { console.log('Failed to clear events:', e.message || e); }

  // Create events
  console.log('Creating events...');
  const createdEvents = [];
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    try {
      const res = await request({ method: 'POST', path: '/api/v1/admin/events', token: adminToken }, ev);
      if (res && res.success && res.data) {
        createdEvents.push(res.data);
        console.log(`Created event ${i+1}/${events.length}: ${ev.title}`);
      } else {
        console.log(`Create event response unexpected for ${ev.title}:`, res.message || res.raw || res);
      }
    } catch (e) { console.log('Create event failed:', e.message || e); }
  }

  console.log(`Total events created: ${createdEvents.length}`);

  // Prepare seat pool per event
  const seatsByEvent = {};
  for (const ev of createdEvents) {
    try {
      const seatsResp = await request({ method: 'GET', path: `/api/v1/events/${ev.id}/seats`, token: adminToken });
      let seatsData = seatsResp.data;
      // normalize: seat map may come as object with rows
      if (!seatsData) seatsData = [];
      if (!Array.isArray(seatsData)) {
        // try to flatten rows
        const rows = seatsData.rows || seatsData;
        const flat = [];
        for (const k of Object.keys(rows || {})) {
          const arr = rows[k] || [];
          for (const s of arr) flat.push(s);
        }
        seatsData = flat;
      }
      seatsByEvent[ev.id] = seatsData;
      console.log(`Event ${ev.title} has ${seatsByEvent[ev.id].length} seats`);
    } catch (e) { seatsByEvent[ev.id] = []; console.log('Failed to fetch seats for', ev.title, e.message || e); }
  }

  // Create reservations: target ~25 per event when possible
  console.log('Creating reservations...');
  const userTokenCache = {};

  // helper to login user once
  async function getUserToken(email, password) {
    if (userTokenCache[email]) return userTokenCache[email];
    try {
      const r = await request({ method: 'POST', path: '/api/v1/auth/login' }, { email, password });
      const t = r.data && r.data.token;
      userTokenCache[email] = t;
      return t;
    } catch (e) { return null; }
  }

  // shuffle users
  const userPool = usersToCreate.map(u => ({ email: u.email, password: u.password }));

  for (const ev of createdEvents) {
    const seats = (seatsByEvent[ev.id] || []).filter(s => s.status === 'AVAILABLE');
    if (seats.length === 0) { console.log(`No available seats for ${ev.title}`); continue; }
    const target = Math.min(seats.length, randInt(18, 30));
    let reserved = 0;
    let userIndex = 0;
    for (let i = 0; i < seats.length && reserved < target; i++) {
      const seat = seats[i];
      const user = userPool[userIndex % userPool.length];
      userIndex += 1;
      try {
        const token = await getUserToken(user.email, user.password);
        if (!token) { continue; }
        const res = await request({ method: 'POST', path: '/api/v1/reservations', token }, { event_id: ev.id, seat_id: seat.id });
        if (res && res.success) { reserved += 1; }
      } catch (e) { /* ignore individual reservation failures */ }
    }
    console.log(`Reserved ${reserved}/${target} seats for event: ${ev.title}`);
  }

  console.log('Seeding complete.');
}

if (require.main === module) {
  main().catch(e => {
    console.error('Seed error:', e);
    process.exitCode = 1;
  });
}

module.exports = { usersToCreate };

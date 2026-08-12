const events = [
  {
    id: 'evt-1',
    title: 'سمینار تخصصی هوش مصنوعی و آینده پژوهش',
    description: 'بررسی آخرین دستاوردهای هوش مصنوعی در حوزه پژوهش‌های دانشگاهی و فرصت‌های پیش رو برای دانشجویان.',
    event_date: '2026-07-05',
    start_time: '09:00',
    end_time: '12:00',
    total_capacity: 60,
    available_count: 14,
    reserved_count: 46,
    occupancy_rate: 77,
    status: 'ACTIVE',
    poster_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'evt-2',
    title: 'کارگاه عملی React و توسعه وب مدرن',
    description: 'آموزش عملی React، Vite و طراحی رابط کاربری با استفاده از بهترین تجربیات توسعه وب.',
    event_date: '2026-07-12',
    start_time: '14:00',
    end_time: '18:00',
    total_capacity: 50,
    available_count: 20,
    reserved_count: 30,
    occupancy_rate: 60,
    status: 'CLOSED',
    poster_url: '',
  },
  {
    id: 'evt-3',
    title: 'جلسه دفاع از پایان‌نامه‌های برتر دانشکده',
    description: 'ارائه و دفاع از پایانی‌ها و پروژه‌های منتخب رشته‌های مهندسی کامپیوتر و برق.',
    event_date: '2026-07-20',
    start_time: '08:30',
    end_time: '13:00',
    total_capacity: 75,
    available_count: 0,
    reserved_count: 75,
    occupancy_rate: 100,
    status: 'COMPLETED',
    poster_url: '',
  },
];

const seatMaps = {
  'evt-1': {
    event_title: events[0].title,
    poster_url: events[0].poster_url,
    total_capacity: events[0].total_capacity,
    available_seats: events[0].available_count,
    reserved_seats: events[0].reserved_count,
    event_date: events[0].event_date,
    start_time: events[0].start_time,
    end_time: events[0].end_time,
    rows: {
      1: [
        { id: 'evt-1-1-1', row_number: 1, seat_number: 1, seat_label: 'A1', seat_type: 'VIP', status: 'AVAILABLE' },
        { id: 'evt-1-1-2', row_number: 1, seat_number: 2, seat_label: 'A2', seat_type: 'VIP', status: 'RESERVED' },
        { id: 'evt-1-1-3', row_number: 1, seat_number: 3, seat_label: 'A3', seat_type: 'VIP', status: 'RESERVED_BY_USER' },
        { id: 'evt-1-1-4', row_number: 1, seat_number: 4, seat_label: 'A4', seat_type: 'VIP', status: 'AVAILABLE' },
        { id: 'evt-1-1-5', row_number: 1, seat_number: 5, seat_label: 'A5', seat_type: 'VIP', status: 'AVAILABLE' },
        { id: 'evt-1-1-6', row_number: 1, seat_number: 6, seat_label: 'A6', seat_type: 'VIP', status: 'RESERVED' },
      ],
      2: [
        { id: 'evt-1-2-1', row_number: 2, seat_number: 1, seat_label: 'B1', seat_type: 'VIP', status: 'AVAILABLE' },
        { id: 'evt-1-2-2', row_number: 2, seat_number: 2, seat_label: 'B2', seat_type: 'VIP', status: 'AVAILABLE' },
        { id: 'evt-1-2-3', row_number: 2, seat_number: 3, seat_label: 'B3', seat_type: 'VIP', status: 'RESERVED' },
        { id: 'evt-1-2-4', row_number: 2, seat_number: 4, seat_label: 'B4', seat_type: 'VIP', status: 'AVAILABLE' },
        { id: 'evt-1-2-5', row_number: 2, seat_number: 5, seat_label: 'B5', seat_type: 'VIP', status: 'AVAILABLE' },
        { id: 'evt-1-2-6', row_number: 2, seat_number: 6, seat_label: 'B6', seat_type: 'VIP', status: 'RESERVED' },
      ],
      3: [
        { id: 'evt-1-3-1', row_number: 3, seat_number: 1, seat_label: 'C1', seat_type: 'REGULAR', status: 'AVAILABLE' },
        { id: 'evt-1-3-2', row_number: 3, seat_number: 2, seat_label: 'C2', seat_type: 'REGULAR', status: 'RESERVED' },
        { id: 'evt-1-3-3', row_number: 3, seat_number: 3, seat_label: 'C3', seat_type: 'REGULAR', status: 'RESERVED' },
        { id: 'evt-1-3-4', row_number: 3, seat_number: 4, seat_label: 'C4', seat_type: 'REGULAR', status: 'AVAILABLE' },
        { id: 'evt-1-3-5', row_number: 3, seat_number: 5, seat_label: 'C5', seat_type: 'REGULAR', status: 'AVAILABLE' },
      ],
      4: [
        { id: 'evt-1-4-1', row_number: 4, seat_number: 1, seat_label: 'D1', seat_type: 'REGULAR', status: 'AVAILABLE' },
        { id: 'evt-1-4-2', row_number: 4, seat_number: 2, seat_label: 'D2', seat_type: 'REGULAR', status: 'AVAILABLE' },
        { id: 'evt-1-4-3', row_number: 4, seat_number: 3, seat_label: 'D3', seat_type: 'REGULAR', status: 'RESERVED' },
        { id: 'evt-1-4-4', row_number: 4, seat_number: 4, seat_label: 'D4', seat_type: 'REGULAR', status: 'AVAILABLE' },
        { id: 'evt-1-4-5', row_number: 4, seat_number: 5, seat_label: 'D5', seat_type: 'REGULAR', status: 'AVAILABLE' },
        { id: 'evt-1-4-6', row_number: 4, seat_number: 6, seat_label: 'D6', seat_type: 'REGULAR', status: 'RESERVED' },
      ],
    },
  },
  'evt-2': {
    event_title: events[1].title,
    poster_url: events[1].poster_url,
    total_capacity: events[1].total_capacity,
    available_seats: events[1].available_count,
    reserved_seats: events[1].reserved_count,
    event_date: events[1].event_date,
    start_time: events[1].start_time,
    end_time: events[1].end_time,
    rows: {
      1: [
        { id: 'evt-2-1-1', row_number: 1, seat_number: 1, seat_label: 'A1', seat_type: 'REGULAR', status: 'AVAILABLE' },
        { id: 'evt-2-1-2', row_number: 1, seat_number: 2, seat_label: 'A2', seat_type: 'REGULAR', status: 'AVAILABLE' },
        { id: 'evt-2-1-3', row_number: 1, seat_number: 3, seat_label: 'A3', seat_type: 'REGULAR', status: 'RESERVED' },
        { id: 'evt-2-1-4', row_number: 1, seat_number: 4, seat_label: 'A4', seat_type: 'REGULAR', status: 'RESERVED' },
        { id: 'evt-2-1-5', row_number: 1, seat_number: 5, seat_label: 'A5', seat_type: 'REGULAR', status: 'AVAILABLE' },
      ],
      2: [
        { id: 'evt-2-2-1', row_number: 2, seat_number: 1, seat_label: 'B1', seat_type: 'REGULAR', status: 'AVAILABLE' },
        { id: 'evt-2-2-2', row_number: 2, seat_number: 2, seat_label: 'B2', seat_type: 'REGULAR', status: 'RESERVED' },
        { id: 'evt-2-2-3', row_number: 2, seat_number: 3, seat_label: 'B3', seat_type: 'REGULAR', status: 'AVAILABLE' },
        { id: 'evt-2-2-4', row_number: 2, seat_number: 4, seat_label: 'B4', seat_type: 'REGULAR', status: 'AVAILABLE' },
        { id: 'evt-2-2-5', row_number: 2, seat_number: 5, seat_label: 'B5', seat_type: 'REGULAR', status: 'RESERVED' },
      ],
    },
  },
  'evt-3': {
    event_title: events[2].title,
    poster_url: events[2].poster_url,
    total_capacity: events[2].total_capacity,
    available_seats: events[2].available_count,
    reserved_seats: events[2].reserved_count,
    event_date: events[2].event_date,
    start_time: events[2].start_time,
    end_time: events[2].end_time,
    rows: {
      1: [
        { id: 'evt-3-1-1', row_number: 1, seat_number: 1, seat_label: 'A1', seat_type: 'VIP', status: 'RESERVED' },
        { id: 'evt-3-1-2', row_number: 1, seat_number: 2, seat_label: 'A2', seat_type: 'VIP', status: 'RESERVED' },
        { id: 'evt-3-1-3', row_number: 1, seat_number: 3, seat_label: 'A3', seat_type: 'VIP', status: 'RESERVED' },
        { id: 'evt-3-1-4', row_number: 1, seat_number: 4, seat_label: 'A4', seat_type: 'VIP', status: 'RESERVED' },
      ],
      2: [
        { id: 'evt-3-2-1', row_number: 2, seat_number: 1, seat_label: 'B1', seat_type: 'REGULAR', status: 'RESERVED' },
        { id: 'evt-3-2-2', row_number: 2, seat_number: 2, seat_label: 'B2', seat_type: 'REGULAR', status: 'RESERVED' },
        { id: 'evt-3-2-3', row_number: 2, seat_number: 3, seat_label: 'B3', seat_type: 'REGULAR', status: 'RESERVED' },
        { id: 'evt-3-2-4', row_number: 2, seat_number: 4, seat_label: 'B4', seat_type: 'REGULAR', status: 'RESERVED' },
      ],
    },
  },
};

const reservations = {
  active: [
    {
      id: 'res-1',
      event_id: 'evt-1',
      event_title: events[0].title,
      event_date: events[0].event_date,
      start_time: events[0].start_time,
      end_time: events[0].end_time,
      seat_label: 'A3',
      row_number: 1,
      status: 'ACTIVE',
      user_full_name: 'رضا رضایی',
      user_student_id: '98123456',
      reserved_at: '2026-06-22T10:12:00Z',
    },
    {
      id: 'res-2',
      event_id: 'evt-2',
      event_title: events[1].title,
      event_date: events[1].event_date,
      start_time: events[1].start_time,
      end_time: events[1].end_time,
      seat_label: 'B4',
      row_number: 2,
      status: 'ACTIVE',
      user_full_name: 'سارا محمدی',
      user_student_id: '98123457',
      reserved_at: '2026-06-23T14:30:00Z',
    },
  ],
  history: [
    {
      id: 'res-3',
      event_id: 'evt-3',
      event_title: events[2].title,
      event_date: events[2].event_date,
      start_time: events[2].start_time,
      end_time: events[2].end_time,
      seat_label: 'A1',
      row_number: 1,
      status: 'CANCELLED',
      user_full_name: 'مهدی علیزاده',
      user_student_id: '98123458',
      reserved_at: '2026-06-19T09:00:00Z',
    },
  ],
};

const stats = {
  active_events: 2,
  total_seats: 185,
  today_reservations: 12,
  total_users: 342,
  weekly_events: 5,
  reservation_trend: [
    { date: '1405/04/04', count: 5 },
    { date: '1405/04/05', count: 8 },
    { date: '1405/04/06', count: 12 },
    { date: '1405/04/07', count: 18 },
    { date: '1405/04/08', count: 20 },
    { date: '1405/04/09', count: 16 },
    { date: '1405/04/10', count: 14 },
  ],
  recent_reservations: [
    {
      user_full_name: 'رضا رضایی',
      user_student_id: '98123456',
      event_title: events[0].title,
      seat_label: 'A3',
      status: 'ACTIVE',
    },
    {
      user_full_name: 'سارا محمدی',
      user_student_id: '98123457',
      event_title: events[1].title,
      seat_label: 'B4',
      status: 'ACTIVE',
    },
  ],
};

const occupancyData = {
  labels: [events[0].title, events[1].title, events[2].title],
  data: [events[0].occupancy_rate, events[1].occupancy_rate, events[2].occupancy_rate],
};

const eventReports = {
  'evt-1': {
    event_title: events[0].title,
    reserved_count: events[0].reserved_count,
    available_count: events[0].available_count,
    total_capacity: events[0].total_capacity,
  },
  'evt-2': {
    event_title: events[1].title,
    reserved_count: events[1].reserved_count,
    available_count: events[1].available_count,
    total_capacity: events[1].total_capacity,
  },
  'evt-3': {
    event_title: events[2].title,
    reserved_count: events[2].reserved_count,
    available_count: events[2].available_count,
    total_capacity: events[2].total_capacity,
  },
};

const defaultData = {
  events,
  seatMaps,
  reservations,
  stats,
  occupancyData,
  eventReports,
};

export default defaultData;

const expectations = {
  users: 220,
  eventsPerStatus: 50,
  activeReservations: 1000,
  completedReservations: 500,
  cancelledReservations: 500,
  auditsPerAction: 50,
};

const eventStatuses = ['ACTIVE', 'CLOSED', 'COMPLETED', 'CANCELLED'];
const auditActions = ['CREATE_EVENT', 'UPDATE_EVENT', 'DELETE_EVENT', 'TOGGLE_USER', 'CHANGE_ROLE'];
const errors = [];

const events = Array.from({ length: 200 }, (_, index) => {
  const eventNo = index + 1;
  return {
    eventNo,
    status: eventStatuses[Math.floor(index / expectations.eventsPerStatus)],
    capacity: 80 + ((eventNo - 1) % 5) * 16,
  };
});

const reservations = [];
for (let i = 1; i <= expectations.activeReservations; i += 1) {
  const eventNo = Math.floor((i - 1) / 10) + 1;
  const slotNo = ((i - 1) % 10) + 1;
  reservations.push({
    status: 'ACTIVE',
    eventNo,
    userNo: 51 + ((eventNo * 13 + slotNo * 7) % 120),
    seatNo: slotNo,
  });
}
for (let i = 1; i <= expectations.completedReservations; i += 1) {
  const eventNo = 101 + Math.floor((i - 1) / 10);
  const slotNo = ((i - 1) % 10) + 1;
  reservations.push({
    status: 'COMPLETED',
    eventNo,
    userNo: 51 + ((eventNo * 19 + slotNo * 11) % 120),
    seatNo: slotNo,
  });
}
for (let i = 1; i <= expectations.cancelledReservations; i += 1) {
  const eventNo = ((i - 1) % 200) + 1;
  const occurrenceNo = Math.floor((i - 1) / 200);
  reservations.push({
    status: 'CANCELLED',
    eventNo,
    userNo: 171 + ((eventNo + occurrenceNo * 11) % 50),
    seatNo: 41 + occurrenceNo,
  });
}

const eventStatusCounts = Object.fromEntries(eventStatuses.map((status) => [status, 0]));
for (const event of events) eventStatusCounts[event.status] += 1;
for (const [status, count] of Object.entries(eventStatusCounts)) {
  if (count !== expectations.eventsPerStatus) errors.push(`${status} events: expected 50, found ${count}`);
}

const reservationStatusCounts = { ACTIVE: 0, COMPLETED: 0, CANCELLED: 0 };
const userEventKeys = new Set();
const eventSeatKeys = new Set();
for (const reservation of reservations) {
  reservationStatusCounts[reservation.status] += 1;
  const event = events[reservation.eventNo - 1];
  if (!event || reservation.seatNo > event.capacity) {
    errors.push(`invalid seat assignment for event ${reservation.eventNo}, seat ${reservation.seatNo}`);
  }

  const userEventKey = `${reservation.userNo}:${reservation.eventNo}`;
  if (userEventKeys.has(userEventKey)) errors.push(`duplicate user/event assignment ${userEventKey}`);
  userEventKeys.add(userEventKey);

  const eventSeatKey = `${reservation.eventNo}:${reservation.seatNo}`;
  if (eventSeatKeys.has(eventSeatKey)) errors.push(`duplicate event/seat assignment ${eventSeatKey}`);
  eventSeatKeys.add(eventSeatKey);
}

for (const [status, expected] of Object.entries({
  ACTIVE: expectations.activeReservations,
  COMPLETED: expectations.completedReservations,
  CANCELLED: expectations.cancelledReservations,
})) {
  if (reservationStatusCounts[status] !== expected) {
    errors.push(`${status} reservations: expected ${expected}, found ${reservationStatusCounts[status]}`);
  }
}

const totalSeats = events.reduce((sum, event) => sum + event.capacity, 0);
const vipSeats = events.length * 16;
const regularSeats = totalSeats - vipSeats;
if (totalSeats !== 22400) errors.push(`total seats: expected 22400, found ${totalSeats}`);
if (vipSeats < 50 || regularSeats < 50) errors.push('VIP or REGULAR seat coverage is below 50');

const auditCounts = Object.fromEntries(auditActions.map((action) => [action, 0]));
for (let i = 1; i <= auditActions.length * expectations.auditsPerAction; i += 1) {
  auditCounts[auditActions[(i - 1) % auditActions.length]] += 1;
}
for (const [action, count] of Object.entries(auditCounts)) {
  if (count !== expectations.auditsPerAction) errors.push(`${action} audits: expected 50, found ${count}`);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(
  `Full dataset audit passed: ${expectations.users} users, ${events.length} events, ` +
    `${totalSeats} seats, ${reservations.length} reservations and ` +
    `${auditActions.length * expectations.auditsPerAction} audit logs.`,
);

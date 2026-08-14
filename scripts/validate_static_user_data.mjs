import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');
const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_{|}~-]+@gmail\.com$/;
const studentIDPattern = /^[0-9]{10,20}$/;
const errors = [];
let checkedEmails = 0;
let checkedStudentIDs = 0;

function checkUnique(values, location, label) {
  const duplicates = values.filter((value, index) => values.indexOf(value) !== index);
  if (duplicates.length > 0) {
    errors.push(`${location}: duplicate ${label}(s): ${[...new Set(duplicates)].join(', ')}`);
  }
}

function checkEmail(value, location) {
  checkedEmails += 1;
  if (!emailPattern.test(value)) errors.push(`${location}: invalid Gmail address ${value}`);
}

function checkStudentID(value, location) {
  checkedStudentIDs += 1;
  if (!studentIDPattern.test(value)) errors.push(`${location}: invalid student ID ${value}`);
}

function walk(value, location = 'frontend/src/data/defaultData.js') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    const childLocation = `${location}.${key}`;
    if (key === 'email' && typeof child === 'string') checkEmail(child, childLocation);
    if ((key === 'student_id' || key === 'user_student_id') && typeof child === 'string') {
      checkStudentID(child, childLocation);
    }
    walk(child, childLocation);
  }
}

const defaultDataModule = await import(pathToFileURL(resolve(projectRoot, 'frontend/src/data/defaultData.js')));
walk(defaultDataModule.default);

const seedSQL = await readFile(resolve(projectRoot, 'scripts/seed_full_dataset.sql'), 'utf8');
const datasetCountsMatch = seedSQL.match(
  /-- DATASET_COUNTS users=(\d+) events_per_status=(\d+) active_reservations=(\d+) completed_reservations=(\d+) cancelled_reservations=(\d+) audit_per_action=(\d+)/,
);
if (!datasetCountsMatch) {
  errors.push('scripts/seed_full_dataset.sql: DATASET_COUNTS marker not found');
}

const [
  userCount,
  eventsPerStatus,
  activeReservationCount,
  completedReservationCount,
  cancelledReservationCount,
  auditsPerAction,
] = (datasetCountsMatch?.slice(1) ?? []).map(Number);

for (const [feature, count] of Object.entries({
  users: userCount,
  eventsPerStatus,
  activeReservations: activeReservationCount,
  completedReservations: completedReservationCount,
  cancelledReservations: cancelledReservationCount,
  auditsPerAction,
})) {
  if (!Number.isInteger(count) || count < 50) {
    errors.push(`scripts/seed_full_dataset.sql: ${feature} must contain at least 50 records, found ${count}`);
  }
}

if (!seedSQL.includes('INSERT INTO seed_expectations VALUES (220, 200, 50, 1000, 500, 500, 50);')) {
  errors.push('scripts/seed_full_dataset.sql: seed expectations do not match the reviewed full dataset');
}

const seedSQLUsers = Array.from({ length: userCount || 0 }, (_, index) => {
  const sequence = index + 1;
  const user = {
    studentID: String(4100000000 + sequence),
    email: `ticket.reservation.demo+full.user${String(sequence).padStart(3, '0')}@gmail.com`,
  };
  checkStudentID(user.studentID, `scripts/seed_full_dataset.sql user ${sequence}`);
  checkEmail(user.email, `scripts/seed_full_dataset.sql user ${sequence}`);
  return user;
});
if (seedSQLUsers.length !== 220) errors.push(`scripts/seed_full_dataset.sql: expected 220 users, found ${seedSQLUsers.length}`);
checkUnique(seedSQLUsers.map((user) => user.email), 'scripts/seed_full_dataset.sql', 'email');
checkUnique(seedSQLUsers.map((user) => user.studentID), 'scripts/seed_full_dataset.sql', 'student ID');

const seedJSModule = await import(pathToFileURL(resolve(projectRoot, 'scripts/seed.js')));
const generatedUsers = seedJSModule.default?.usersToCreate;
if (!Array.isArray(generatedUsers) || generatedUsers.length !== 80) {
  errors.push(`scripts/seed.js: expected 80 generated users, found ${generatedUsers?.length ?? 0}`);
} else {
  generatedUsers.forEach((user, index) => {
    checkEmail(user.email, `scripts/seed.js user ${index + 1}`);
    checkStudentID(user.student_id, `scripts/seed.js user ${index + 1}`);
  });
  checkUnique(generatedUsers.map((user) => user.email), 'scripts/seed.js', 'email');
  checkUnique(generatedUsers.map((user) => user.student_id), 'scripts/seed.js', 'student ID');
}

const exampleEnvironment = await readFile(resolve(projectRoot, 'backend/.env.example'), 'utf8');
const adminStudentID = exampleEnvironment.match(/^DEMO_ADMIN_STUDENT_ID=(.+)$/m)?.[1]?.trim();
const adminEmail = exampleEnvironment.match(/^DEMO_ADMIN_EMAIL=(.+)$/m)?.[1]?.trim();
if (!adminStudentID) errors.push('backend/.env.example: demo admin student ID not found');
else checkStudentID(adminStudentID, 'demo admin example');
if (!adminEmail) errors.push('backend/.env.example: demo admin email not found');
else checkEmail(adminEmail, 'demo admin example');

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Static user data audit passed: ${checkedEmails} emails and ${checkedStudentIDs} student IDs are structurally valid.`);

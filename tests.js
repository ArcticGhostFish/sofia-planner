/**
 * tests.js – Sofia Planner unit tests
 * Run with: node tests.js
 *
 * Tests pure logic functions extracted/mirrored from app.js.
 * No DOM or browser APIs required.
 */

// ===== MINI TEST RUNNER =====
let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  \u2713 ${name}`);
    passed++;
  } catch (e) {
    console.error(`  \u2717 ${name}: ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function assertEqual(a, b, msg) {
  const as = JSON.stringify(a), bs = JSON.stringify(b);
  if (as !== bs) throw new Error(msg || `Expected ${bs}, got ${as}`);
}

// ===== PURE FUNCTIONS (mirrored from app.js) =====

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function hKey(id, d) {
  const date = d instanceof Date ? d.toLocaleDateString('sv-SE') : d;
  return id + '_' + date;
}

function fmtKr(n) {
  return n.toLocaleString('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' kr';
}

// Pure schedule helpers (same logic as app.js but return new objects instead of mutating state)
function addScheduleClassPure(schedule, weekId, dayIdx, label) {
  const result = JSON.parse(JSON.stringify(schedule));
  const week = result.find(w => w.id === weekId);
  if (!week || !week.days[dayIdx]) return result;
  week.days[dayIdx].classes.push(label);
  return result;
}

function removeScheduleClassPure(schedule, weekId, dayIdx, clsIdx) {
  const result = JSON.parse(JSON.stringify(schedule));
  const week = result.find(w => w.id === weekId);
  if (!week || !week.days[dayIdx]) return result;
  week.days[dayIdx].classes.splice(clsIdx, 1);
  return result;
}

function removeScheduleWeekPure(schedule, id) {
  return schedule.filter(w => w.id !== id);
}

function addScheduleWeekPure(schedule, weekLabel, dates, fixedId) {
  const days = dates.map(date => ({ date, classes: [] }));
  return [...schedule, { id: fixedId || Date.now(), week: weekLabel, days }];
}

// Pure radio helpers
function addRadioStationPure(stations, name, url) {
  return [...stations, { name, url }];
}

function removeRadioStationPure(stations, i) {
  return stations.filter((_, idx) => idx !== i);
}

// Budget helpers
function calcBudgetTotals(budget) {
  let inc = 0, exp = 0, sav = 0;
  budget.forEach(b => {
    if (b.dir === 'income') inc += b.amount;
    else if (b.dir === 'expense') exp += b.amount;
    else sav += b.amount;
  });
  return { inc, exp, sav, bal: inc - exp - sav };
}

// ===== TESTS =====

console.log('\n\ud83d\udccb Sofia Planner – Unit Tests\n');

// --- escHtml ---
console.log('escHtml:');
test('escapes <script>', () => {
  assertEqual(escHtml('<script>'), '&lt;script&gt;');
});
test('escapes ampersand', () => {
  assertEqual(escHtml('a & b'), 'a &amp; b');
});
test('escapes double quotes', () => {
  assertEqual(escHtml('"hi"'), '&quot;hi&quot;');
});
test('passes plain text through unchanged', () => {
  assertEqual(escHtml('hello world'), 'hello world');
});
test('converts non-string to string', () => {
  assertEqual(escHtml(42), '42');
});

// --- hKey ---
console.log('\nhKey:');
test('builds key from id and string date', () => {
  assertEqual(hKey(1, '2026-03-07'), '1_2026-03-07');
});
test('builds key from id and string date (habit 5)', () => {
  assertEqual(hKey(5, '2026-01-01'), '5_2026-01-01');
});
test('builds key from id and Date object (date string portion present)', () => {
  const result = hKey(3, new Date(2026, 2, 7));
  assert(result.startsWith('3_'), 'Key should start with id_');
  assert(result.length > 3, 'Key should have a date part');
});

// --- fmtKr ---
console.log('\nfmtKr:');
test('appends kr suffix', () => {
  assert(fmtKr(1000).endsWith(' kr'), 'Should end with " kr"');
});
test('formats zero', () => {
  assert(fmtKr(0).includes('0'), 'Should include 0');
});
test('formats large number', () => {
  const result = fmtKr(13804);
  assert(result.includes('kr'), 'Should have kr');
  assert(!result.includes('NaN'), 'Should not be NaN');
});

// --- Schedule management ---
console.log('\nSchedule management:');

const BASE_SCHEDULE = [
  { id: 1, week: 'V6', days: [
    { date: '9.2',  classes: ['10\u201312 Lecture'] },
    { date: '10.2', classes: [] }
  ]},
  { id: 2, week: 'V7', days: [
    { date: '16.2', classes: ['13\u201315 Lab'] },
    { date: '17.2', classes: [] }
  ]}
];

test('addScheduleClassPure adds class to correct day', () => {
  const result = addScheduleClassPure(BASE_SCHEDULE, 1, 1, 'New Class');
  assertEqual(result[0].days[1].classes, ['New Class']);
});

test('addScheduleClassPure does not mutate original', () => {
  addScheduleClassPure(BASE_SCHEDULE, 1, 1, 'Mutated?');
  assertEqual(BASE_SCHEDULE[0].days[1].classes, []);
});

test('addScheduleClassPure appends to existing classes', () => {
  const result = addScheduleClassPure(BASE_SCHEDULE, 1, 0, 'Extra');
  assertEqual(result[0].days[0].classes, ['10\u201312 Lecture', 'Extra']);
});

test('addScheduleClassPure ignores unknown weekId', () => {
  const result = addScheduleClassPure(BASE_SCHEDULE, 999, 0, 'X');
  assertEqual(result, BASE_SCHEDULE);
});

test('addScheduleClassPure ignores out-of-range dayIdx', () => {
  const result = addScheduleClassPure(BASE_SCHEDULE, 1, 99, 'X');
  assertEqual(result, BASE_SCHEDULE);
});

test('removeScheduleClassPure removes class by index', () => {
  const result = removeScheduleClassPure(BASE_SCHEDULE, 1, 0, 0);
  assertEqual(result[0].days[0].classes, []);
});

test('removeScheduleClassPure does not mutate original', () => {
  removeScheduleClassPure(BASE_SCHEDULE, 1, 0, 0);
  assertEqual(BASE_SCHEDULE[0].days[0].classes, ['10\u201312 Lecture']);
});

test('removeScheduleWeekPure removes correct week', () => {
  const result = removeScheduleWeekPure(BASE_SCHEDULE, 1);
  assertEqual(result.length, 1);
  assertEqual(result[0].week, 'V7');
});

test('removeScheduleWeekPure ignores unknown id', () => {
  const result = removeScheduleWeekPure(BASE_SCHEDULE, 999);
  assertEqual(result.length, 2);
});

test('addScheduleWeekPure adds week with correct structure', () => {
  const dates = ['7.4', '8.4', '9.4', '10.4', '11.4'];
  const result = addScheduleWeekPure(BASE_SCHEDULE, 'V10', dates, 99);
  assertEqual(result.length, 3);
  assertEqual(result[2].week, 'V10');
  assertEqual(result[2].days.length, 5);
  assertEqual(result[2].days[0].date, '7.4');
  assertEqual(result[2].days[0].classes, []);
  assertEqual(result[2].days[4].date, '11.4');
});

test('addScheduleWeekPure does not mutate original', () => {
  addScheduleWeekPure(BASE_SCHEDULE, 'V11', ['1.5','2.5','3.5','4.5','5.5'], 100);
  assertEqual(BASE_SCHEDULE.length, 2);
});

// --- Radio station management ---
console.log('\nRadio station management:');

const BASE_STATIONS = [
  { name: 'P3', url: 'https://example.com/p3.mp3' },
  { name: 'P1', url: 'https://example.com/p1.mp3' }
];

test('addRadioStationPure adds station at end', () => {
  const result = addRadioStationPure(BASE_STATIONS, 'NRJ', 'https://nrj.se/stream');
  assertEqual(result.length, 3);
  assertEqual(result[2], { name: 'NRJ', url: 'https://nrj.se/stream' });
});

test('addRadioStationPure does not mutate original', () => {
  addRadioStationPure(BASE_STATIONS, 'X', 'http://x.com');
  assertEqual(BASE_STATIONS.length, 2);
});

test('removeRadioStationPure removes by index 0', () => {
  const result = removeRadioStationPure(BASE_STATIONS, 0);
  assertEqual(result.length, 1);
  assertEqual(result[0].name, 'P1');
});

test('removeRadioStationPure removes by index 1', () => {
  const result = removeRadioStationPure(BASE_STATIONS, 1);
  assertEqual(result.length, 1);
  assertEqual(result[0].name, 'P3');
});

test('removeRadioStationPure does not mutate original', () => {
  removeRadioStationPure(BASE_STATIONS, 0);
  assertEqual(BASE_STATIONS.length, 2);
});

test('removeRadioStationPure with out-of-range index returns all', () => {
  const result = removeRadioStationPure(BASE_STATIONS, 99);
  assertEqual(result.length, 2);
});

// --- Budget calculations ---
console.log('\nBudget calculations:');

const SAMPLE_BUDGET = [
  { id: 1, name: 'L\u00f6n',    amount: 10000, dir: 'income',  cat: 'Bas' },
  { id: 2, name: 'Hyra',  amount: 3000,  dir: 'expense', cat: 'Boende' },
  { id: 3, name: 'Spara', amount: 2000,  dir: 'saving',  cat: 'Sparande' }
];

test('calcBudgetTotals sums income correctly', () => {
  const { inc } = calcBudgetTotals(SAMPLE_BUDGET);
  assertEqual(inc, 10000);
});

test('calcBudgetTotals sums expenses correctly', () => {
  const { exp } = calcBudgetTotals(SAMPLE_BUDGET);
  assertEqual(exp, 3000);
});

test('calcBudgetTotals sums savings correctly', () => {
  const { sav } = calcBudgetTotals(SAMPLE_BUDGET);
  assertEqual(sav, 2000);
});

test('calcBudgetTotals computes balance correctly', () => {
  const { bal } = calcBudgetTotals(SAMPLE_BUDGET);
  assertEqual(bal, 5000); // 10000 - 3000 - 2000
});

test('calcBudgetTotals handles empty array', () => {
  const { inc, exp, sav, bal } = calcBudgetTotals([]);
  assertEqual(inc, 0); assertEqual(exp, 0); assertEqual(sav, 0); assertEqual(bal, 0);
});

// ===== SUMMARY =====
console.log(`\n${'─'.repeat(36)}`);
console.log(`Passed: ${passed}  |  Failed: ${failed}`);
if (failed > 0) process.exit(1);

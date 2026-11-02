// Run: node --experimental-strip-types --test src/lib/dates/dates.test.ts
// Run it under several time zones too: TZ=America/Toronto, TZ=Europe/Lisbon, TZ=Pacific/Kiritimati.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dateHint, dayFirst, parseDate } from './parse-date.ts';
import { fromIso, inviteDay, toIso, weekday } from './calendar-date.ts';

const tenants = readdirSync(new URL('../data/tenants/', import.meta.url)).map(
  (f) => JSON.parse(readFileSync(new URL(`../data/tenants/${f}`, import.meta.url), 'utf8')) as { handle: string; locale: string; form: string },
);

// Issue #1
test('a day-first locale reads 07/04/2026 as 7 April', () => {
  assert.deepEqual(parseDate('07/04/2026', 'en-GB'), { year: 2026, month: 4, day: 7 });
  assert.deepEqual(parseDate('07.04.2026', 'de-DE'), { year: 2026, month: 4, day: 7 });
  assert.deepEqual(parseDate('2/12/2026', 'cs-CZ'), { year: 2026, month: 12, day: 2 });
});

test('a month-first locale still reads 07/04/2026 as 4 July', () => {
  assert.deepEqual(parseDate('07/04/2026', 'en-US'), { year: 2026, month: 7, day: 4 });
});

test('every tenant on file reads its own dates the way it writes them', () => {
  for (const t of tenants) {
    assert.equal(dayFirst(t.locale), true, t.handle);
    assert.deepEqual(parseDate('10/12/2026', t.locale), { year: 2026, month: 12, day: 10 }, t.handle);
  }
});

test('ISO dates are year-month-day in every locale', () => {
  assert.deepEqual(parseDate('2026-10-06', 'en-US'), { year: 2026, month: 10, day: 6 });
  assert.deepEqual(parseDate('2026-10-06', 'de-DE'), { year: 2026, month: 10, day: 6 });
});

test('not a real date is null, never a guess', () => {
  for (const bad of ['31/02/2026', '00/01/2026', '13/13/2026', '7/4/26', 'tomorrow', '', '1/2']) {
    assert.equal(parseDate(bad, 'en-GB'), null, bad);
  }
});

// Issue #2
test('no day-first tenant is told to type month first', () => {
  for (const t of tenants) assert.equal(dateHint(t.locale), 'DD/MM/YYYY', `${t.handle} (${t.form})`);
});

test('the hint and the parser agree: typing what the hint says is read as it was meant', () => {
  for (const locale of ['en-US', 'en-GB', 'de-DE', 'es-ES', 'pt-PT']) {
    const typed = dateHint(locale) === 'DD/MM/YYYY' ? '08/09/2026' : '09/08/2026'; // meant: 8 September
    assert.deepEqual(parseDate(typed, locale), { year: 2026, month: 9, day: 8 }, locale);
  }
});

// Issue #3
test('a calendar date keeps its weekday in every process time zone', () => {
  const d = fromIso('2026-10-06')!;
  assert.equal(weekday(d), 'Tuesday');
  assert.equal(inviteDay(d, 'en-GB'), 'Tuesday 6 October');
  assert.equal(inviteDay(fromIso('2026-05-12')!, 'en-GB'), 'Tuesday 12 May');
  assert.equal(inviteDay(fromIso('2026-05-11')!, 'en-GB'), 'Monday 11 May');
});

test('every day of June, a DST month, keeps its day', () => {
  for (let day = 1; day <= 30; day++) {
    const iso = `2026-06-${String(day).padStart(2, '0')}`;
    const d = fromIso(iso)!;
    assert.equal(toIso(d), iso);
    assert.equal(new RegExp(`\\b${day}\\b`).test(inviteDay(d, 'en-GB')), true, iso);
  }
});

test('an invalid ISO date is null', () => {
  assert.equal(fromIso('2026-02-30'), null);
  assert.equal(fromIso('2026-6-1'), null);
});

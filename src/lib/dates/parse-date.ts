// Issue #1: the shared parser reads every date month first, so day-first tenants get flipped dates.
// This parser reads a date the way the tenant's locale writes it. Locale order is asked of the
// platform (Intl), never typed in a list, the same way causes.ts does it.
// Issue #2: the booking form's hint is derived from the same order, so the hint and the parser agree.
import type { CalendarDate } from './calendar-date.ts';

// Does this locale write the day before the month?
export function dayFirst(locale: string): boolean {
  const order = new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(Date.UTC(2026, 0, 2, 12)))
    .map((p) => p.type);
  return order.indexOf('day') < order.indexOf('month');
}

// What the form prints under the date field for this locale: DD/MM/YYYY or MM/DD/YYYY.
export function dateHint(locale: string): 'DD/MM/YYYY' | 'MM/DD/YYYY' {
  return dayFirst(locale) ? 'DD/MM/YYYY' : 'MM/DD/YYYY';
}

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

// Reads "7/4/2026", "07.04.2026" or "2026-04-07". A four digit year first is ISO, year-month-day
// in every locale. A year last is read in the order of the tenant's locale. Anything that is not a
// real calendar date is null, never a guess.
export function parseDate(input: string, locale: string): CalendarDate | null {
  const parts = input.trim().split(/[/.\-\s]+/).filter(Boolean);
  if (parts.length !== 3 || !parts.every((p) => /^\d+$/.test(p))) return null;
  const [a, b, c] = parts;

  let year: string, month: string, day: string;
  if (a.length === 4) [year, month, day] = [a, b, c];
  else if (c.length === 4) [year, month, day] = dayFirst(locale) ? [c, b, a] : [c, a, b];
  else return null;

  const d = { year: Number(year), month: Number(month), day: Number(day) };
  if (d.year < 1000 || d.month < 1 || d.month > 12 || d.day < 1 || d.day > daysInMonth(d.year, d.month)) return null;
  return d;
}

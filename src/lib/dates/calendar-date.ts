// Issue #3: some invites move by one day (Lisbon got Tuesday, Toronto got Monday, same meeting).
// A booking is a calendar date, not an instant. The date 2026-10-06 is the same day for everyone, so
// it must never go through the process time zone. Building a Date from a date-only string and
// reading it back in local time shifts the day for every viewer west of UTC. These helpers keep a
// date as year, month and day, and only use a Date as UTC noon to ask Intl for names.
export type CalendarDate = { year: number; month: number; day: number };

const pad = (n: number, width: number) => String(n).padStart(width, '0');

export const toIso = (d: CalendarDate): string => `${pad(d.year, 4)}-${pad(d.month, 2)}-${pad(d.day, 2)}`;

export function fromIso(iso: string): CalendarDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  const check = new Date(Date.UTC(d.year, d.month - 1, d.day));
  return check.getUTCFullYear() === d.year && check.getUTCMonth() === d.month - 1 && check.getUTCDate() === d.day ? d : null;
}

// UTC noon is far from midnight in both directions, so no zone offset or DST change moves the day.
const noonUtc = (d: CalendarDate) => new Date(Date.UTC(d.year, d.month - 1, d.day, 12));

// "Tuesday 6 October" for the tenant's locale. The same text in every process time zone.
export function inviteDay(d: CalendarDate, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(noonUtc(d));
}

export function weekday(d: CalendarDate, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(noonUtc(d));
}

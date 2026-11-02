// Splits the reports merged into one ticket by what actually went wrong. Pages show these numbers; this file computes them.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

// `clock` is not a cause causes.ts can tell from tenant and channel alone: these reports describe a
// one-day move, not a flipped month. The desk read them one by one and listed them in desk-notes.json.
export type Problem = 'parser' | 'hint' | 'clock';

export type Split = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  firstSeen: string;
  lastSeen: string;
};

export function splitTicket(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): Split[] {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const by = new Map<Problem, Report[]>();
  for (const r of merged) {
    const c = oneDayMove.includes(r.id) ? 'clock' : causeOf(r, tenantOf(r));
    if (c === null) continue;
    by.set(c, [...(by.get(c) ?? []), r]);
  }
  return [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}

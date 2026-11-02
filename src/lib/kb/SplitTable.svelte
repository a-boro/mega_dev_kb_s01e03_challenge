<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { groupByCause, readAs, uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  let { ticket }: { ticket: number } = $props();

  const exported = (reports as Report[]).length;
  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByCause(merged, tenantOf));

  const NAME: Record<string, string> = {
    parser: 'the shared parser reads day-first dates month-first',
    hint: 'the booking-v3 form hint says MM/DD/YYYY',
  };
  // What engineering did with each cause when it closed the ticket.
  const DESK: Record<string, string> = { parser: 'fixed', hint: "won't fix, form retired" };
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports merged into #{ticket} ({exported} rows exported, {exported - merged.length} repeated ids) ·
  <strong>{groups.length}</strong> problems
</p>

<table>
  <thead><tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th><th>desk</th></tr></thead>
  <tbody>
    {#each groups as g (g.cause)}
      <tr>
        <td><code>{g.cause}</code> · {NAME[g.cause] ?? 'unplaced'}</td>
        <td>{g.reports.length}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>{DESK[g.cause] ?? ''}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each groups as g (g.cause)}
  {@const moved = readAs(g, notes.oneDayMove)}
  {#if moved}
    <p class="note">{moved} of the {g.reports.length} <code>{g.cause}</code> reports read as a one-day move; filed under <code>{g.cause}</code> by tenant.</p>
  {/if}
{/each}

<style>
  .sum { font-size: 1.05rem; }
  .note { color: var(--muted); font-size: 0.85em; }
</style>

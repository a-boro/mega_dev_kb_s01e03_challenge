<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket } from '#lib/kb/split';

  let { ticket }: { ticket: number } = $props();

  const exported = (reports as Report[]).length;
  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket).length);
  const splits = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const placed = $derived(splits.reduce((n, s) => n + s.reports.length, 0));

  const NAME = { parser: 'parser reads day-first dates month-first', hint: 'booking-v3 form hint says MM/DD/YYYY', clock: 'invites move by one day' };
</script>

<p class="sum">
  <strong>{merged}</strong> reports merged into #{ticket} ({exported} rows exported, {exported - merged} repeated ids) ·
  <strong>{splits.length}</strong> problems · <strong>{placed}</strong> placed
</p>

<table>
  <thead><tr><th>problem</th><th>reports</th><th>tenants</th><th>seen</th></tr></thead>
  <tbody>
    {#each splits as s (s.problem)}
      <tr>
        <td><code>{s.problem}</code> · {NAME[s.problem]}</td>
        <td>{s.reports.length}</td>
        <td>{s.tenants.length}</td>
        <td>{s.firstSeen} → {s.lastSeen}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.05rem; }
</style>

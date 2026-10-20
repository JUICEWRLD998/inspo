// Can an anonymous visitor read private entities on the deployed app?
// Planted positive control: RateCard is public on purpose and MUST return rows, otherwise the probe is broken
// (wrong URL, outage) and an empty Quote list would prove nothing.
// Usage: node eval/anon-access.mjs <appBaseUrl> <appId>
const [base, appId] = process.argv.slice(2);
if (!base || !appId) throw new Error("usage: node eval/anon-access.mjs <appBaseUrl> <appId>");
const get = async (name) => {
  const res = await fetch(`${base}/api/apps/${appId}/entities/${name}`);
  const body = await res.json().catch(() => null);
  return { status: res.status, rows: Array.isArray(body) ? body.length : null };
};
const control = await get("RateCard");
if (control.status !== 200 || !control.rows) {
  console.error("PROBE BROKEN: the public control returned", control);
  process.exit(2);
}
let failed = false;
for (const name of ["Quote", "Customer", "Order"]) {
  const r = await get(name);
  const leaked = r.rows > 0;
  console.log(`${name.padEnd(9)} status ${r.status} rows ${r.rows} ${leaked ? "LEAK" : "private"}`);
  failed ||= leaked;
}
console.log(`control RateCard rows ${control.rows} (public by design)`);
process.exit(failed ? 1 : 0);

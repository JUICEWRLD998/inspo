// P7 ledger: dated counts of REAL activity, test quotes excluded. Writes eval/live.json.
// Run from app/: npx base44@latest exec --privileged < ../eval/live.mjs
// The counting is computeLive in publicStats/stats.js (unit-tested), the same code the landing page's proof strip uses.
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
const { computeLive } = await import(pathToFileURL(resolve("base44/functions/publicStats/stats.js")).href);
const [quotes, orders, makers] = await Promise.all([
  base44.entities.Quote.list("-created_date", 1000),
  base44.entities.Order.list("-created_date", 1000),
  base44.entities.Maker.list(),
]);
const origin = makers[0]?.data_origin ?? "unknown";
const live = { ...computeLive(quotes, orders, new Date().toISOString()), makerDataOrigin: origin };
// A sample studio's activity is never adoption, whatever the counts say.
if (origin !== "real") live.note = "The studio is not marked real, so none of these counts is adoption evidence.";
const out = resolve("../eval/live.json");
writeFileSync(out, JSON.stringify(live, null, 2) + "\n");
console.log(JSON.stringify(live));

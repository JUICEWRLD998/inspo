// Pricing eval: run past orders through priceQuote and compare with the price actually charged.
// Usage: node eval/run.mjs [dataDir]   (default data/sample)
// The `features` in orders.json are transcribed by hand. This measures the PRICING ENGINE against her rate card.
// It does not measure photo reading; that needs real photos with ground truth.
import { readFileSync, writeFileSync } from "node:fs";
import { priceQuote } from "../app/base44/functions/priceQuote/pricing.js";

const dir = process.argv[2] ?? "data/sample";
const card = JSON.parse(readFileSync(`${dir}/rate-card.json`, "utf8"));
const { orders, _sample } = JSON.parse(readFileSync(`${dir}/orders.json`, "utf8"));
const now = Date.parse("2026-10-20T10:00:00Z");

const rows = orders.map((o) => {
  const q = priceQuote({
    features: o.features, rateCard: card, flavour: o.flavour, now: new Date(now).toISOString(),
    eventDate: new Date(now + o.days_ahead * 86_400_000).toISOString(),
  });
  const err = q.total - o.final_price;
  return {
    id: o.id, description: o.description, charged: o.final_price, quoted: q.total, error: err,
    abs_pct_error: +((Math.abs(err) / o.final_price) * 100).toFixed(2), needs_check: q.needs_check,
  };
});

const sorted = rows.map((r) => r.abs_pct_error).sort((a, b) => a - b);
const mid = Math.floor(sorted.length / 2);
const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
const summary = {
  data: dir, sample_data: Boolean(_sample), orders: rows.length,
  exact_match: rows.filter((r) => r.error === 0).length,
  median_abs_pct_error: median,
  max_abs_pct_error: Math.max(...sorted),
  needed_a_check: rows.filter((r) => r.needs_check.length).length,
  scope: "pricing engine only; features transcribed from order text, no photo reading",
};
const money = (n) => (n / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 });
console.log(`${_sample ? "SAMPLE DATA, NOT A REAL BAKERY\n" : ""}#  charged   quoted    err%   checks  order`);
for (const r of rows) {
  console.log(`${String(r.id).padStart(2)} ${money(r.charged).padStart(8)} ${money(r.quoted).padStart(8)} ${String(r.abs_pct_error).padStart(6)}  ${String(r.needs_check.length).padStart(3)}     ${r.description}`);
}
console.log(summary);
writeFileSync(`eval/results${_sample ? ".sample" : ""}.json`, JSON.stringify({ summary, rows }, null, 2) + "\n");

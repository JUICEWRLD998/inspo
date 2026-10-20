// Replaces the spike test records with the labelled SAMPLE maker and rate card from data/sample.
// Run from app/: SAMPLE_DIR=../data/sample npx base44@latest exec --privileged < ../eval/seed-sample.mjs
import { readFileSync } from "node:fs";
const dir = process.env.SAMPLE_DIR ?? "../data/sample";
const card = JSON.parse(readFileSync(`${dir}/rate-card.json`, "utf8"));
for (const m of await base44.entities.Maker.list()) await base44.entities.Maker.delete(m.id);
for (const r of await base44.entities.RateCard.list()) await base44.entities.RateCard.delete(r.id);
const { _sample, _source, ...rest } = card;
const maker = await base44.entities.Maker.create({
  name: "Aminat Bello (sample)", brand: "Aminat's Cake Studio (sample data)", city: "Lagos (sample)",
  currency: "NGN", lead_time_days: 2, deposit_percent: 70, data_origin: "sample",
});
const rc = await base44.entities.RateCard.create({ ...rest, maker_id: maker.id, data_origin: "sample" });
console.log(JSON.stringify({ maker_id: maker.id, rate_card_id: rc.id }));

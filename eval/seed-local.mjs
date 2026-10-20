// LOCAL UI TESTING ONLY. Fills the throwaway in-memory dev database (base44 dev) so the console can be driven in a
// browser. Run from app/ while `base44 dev` is up: PHOTOS=/dir/with/jpgs npx base44@latest exec --local < ../eval/seed-local.mjs
// Never run against production. Test activity is not adoption and is never counted anywhere.
import { readFileSync } from "node:fs";
const card = JSON.parse(readFileSync("../data/sample/rate-card.json", "utf8"));
const { _sample, _source, ...rest } = card;
const maker = await base44.entities.Maker.create({
  name: "Aminat Bello (sample)", brand: "Aminat's Cake Studio (sample data)", city: "Lagos (sample)", currency: "NGN",
  lead_time_days: 2, deposit_percent: 70, data_origin: "sample", whatsapp_display: "+234 800 000 0000",
  bank_or_payment_note: "Sample payment note: pay the deposit by transfer and send the receipt here.",
});
const rc = await base44.entities.RateCard.create({ ...rest, maker_id: maker.id, data_origin: "sample" });

const photos = [];
for (const f of (process.env.PHOTOS ? ["wedding.jpg", "pound.jpg"] : [])) {
  const up = await base44.integrations.Core.UploadFile({ file: new File([readFileSync(`${process.env.PHOTOS}/${f}`)], f, { type: "image/jpeg" }) });
  photos.push(up.file_url);
}
const c1 = await base44.entities.Customer.create({ whatsapp_id: "2348000000001", name: "Local test customer 1", first_seen_at: new Date().toISOString(), orders_count: 0 });
const c2 = await base44.entities.Customer.create({ whatsapp_id: "2348000000002", name: "Local test customer 2", first_seen_at: new Date().toISOString(), orders_count: 0 });
const day = 864e5;
const feat = (d, over = {}) => ({ tiers: [{ diameter_in: d, height: "standard", confidence: 0.9 }], shape: "round", finish: "buttercream", decorations: [], colours: ["white"], servings_estimate: 20, unreadable: false, ...over });
const dec = (type, c = 0.9) => ({ type, quantity: 1, size: "medium", confidence: c });
const cases = [
  { c: c1, photo: photos[1], f: feat(8, { decorations: [dec("drip"), dec("topper")] }), flavour: "vanilla", delivery: false, days: 14 },
  { c: c2, photo: photos[0], f: feat(10, { finish: "fondant", decorations: [dec("sugar_flowers"), dec("piping", 0.55), dec("other")] }), flavour: "red_velvet", delivery: "island", days: 9 },
];
for (const k of cases) {
  const r = await base44.functions.invoke("saveQuote", {
    rate_card_id: rc.id, image_url: k.photo, features: k.f, flavour: k.flavour, delivery: k.delivery,
    event_date: new Date(Date.now() + k.days * day).toISOString(),
  });
  await base44.entities.Quote.update(r.data.quote_id, { customer_id: k.c.id });
  console.log("quote", JSON.stringify(r.data).slice(0, 160));
}
console.log("seeded", maker.id, rc.id);

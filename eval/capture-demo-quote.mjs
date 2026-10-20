// Captures the hero docket from a REAL run: a photo goes through the deployed extractFeatures, then the pricing engine
// prices the returned features against the sample rate card. Output is printed as JSON; nothing is typed in by hand.
// Run from app/: PROBE_IMAGE=<photo> npx base44@latest exec < ../eval/capture-demo-quote.mjs   (costs one integration credit)
import { readFileSync } from "node:fs";
// exec runs this from a temp file, so a relative import cannot resolve: import by absolute URL from the app folder.
const { priceQuote } = await import(new URL("base44/functions/priceQuote/pricing.js", `file://${process.cwd()}/`).href);
const card = JSON.parse(readFileSync("../data/sample/rate-card.json", "utf8"));
const file = new File([readFileSync(process.env.PROBE_IMAGE)], "demo.jpg", { type: "image/jpeg" });
const up = await base44.integrations.Core.UploadFile({ file });
const r = await base44.functions.invoke("extractFeatures", { image_url: up.file_url });
const features = r.data ?? r;
const capturedAt = new Date().toISOString();
const quote = priceQuote({
  features, rateCard: card, flavour: "vanilla", delivery: false,
  eventDate: new Date(Date.parse(capturedAt) + 21 * 864e5).toISOString(), now: capturedAt,
});
console.log("DEMO_JSON " + JSON.stringify({ capturedAt, source: "deployed extractFeatures + priceQuote engine, sample rate card", features, quote }));

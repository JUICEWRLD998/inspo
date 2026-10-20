// A function deploys only the files inside its own folder, so saveQuote carries a copy of the pricing engine.
// priceQuote/pricing.js is the source of truth; tests/sync.test.js fails if the copy drifts.
import { copyFileSync } from "node:fs";
copyFileSync("base44/functions/priceQuote/pricing.js", "base44/functions/saveQuote/pricing.js");
console.log("synced pricing.js -> saveQuote");

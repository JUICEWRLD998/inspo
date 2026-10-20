// Cuts the 1200x630 social card from the settled signature frame (docket fully printed). Rendered from the local build so the
// platform's injected "Made with Base44" badge is not in it; the replay link and the live-count strip (local test data) are hidden.
// Usage: LANDING_URL=http://localhost:5173 node eval/browser/og.mjs
import { launch } from "./lib.mjs";
const b = await launch();
const ctx = await b.newContext({ ignoreHTTPSErrors: Boolean(process.env.PW_PROXY), colorScheme: "light", viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto(`${process.env.LANDING_URL}/`, { waitUntil: "networkidle" });
await p.addStyleTag({ content: '[class*="replay"], section[aria-label="Counted from real quotes"] { display: none !important; }' });
await p.waitForTimeout(2200); // t = settled
await p.screenshot({ path: "app/public/og.png", type: "png" });
console.log("wrote app/public/og.png");
await b.close();

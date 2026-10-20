// Viewport screenshots down the landing page (readable at full resolution, unlike one tall full-page image).
// Usage: node eval/browser/scroll-shots.mjs <width> [scheme]
import { launch, BASE } from "./lib.mjs";
const w = Number(process.argv[2] ?? 375), scheme = process.argv[3] ?? "light";
const h = w < 768 ? 812 : 900;
const b = await launch();
const ctx = await b.newContext({ ignoreHTTPSErrors: Boolean(process.env.PW_PROXY), colorScheme: scheme, viewport: { width: w, height: h } });
const p = await ctx.newPage();
await p.goto(`${process.env.LANDING_URL ?? BASE}/`, { waitUntil: "networkidle" });
await p.waitForTimeout(1800);
const total = await p.evaluate(() => document.documentElement.scrollHeight);
let i = 0;
for (let y = 0; y < total; y += h - 80, i++) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(250);
  await p.screenshot({ path: `eval/shots/scroll-${w}-${scheme}-${i}.png` });
}
console.log(`${w}px ${scheme}: ${i} screenshots, page height ${total}px`);
await b.close();

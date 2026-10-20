// Screenshots each prototype direction at 1280 and 375. Usage: node eval/browser/explore.mjs <baseUrl>
import { launch } from "./lib.mjs";
const base = process.argv[2] ?? "http://localhost:8099/design/p6/prototypes/index.html";
const b = await launch();
for (const [w, h] of [[1280, 800], [375, 812]]) {
  const ctx = await b.newContext({ colorScheme: "light", viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  for (const v of [1, 2, 3]) {
    await p.goto(`${base}?v=${v}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1900);
    await p.screenshot({ path: `eval/shots/p6-explore-v${v}-${w}.png`, fullPage: w < 800 });
  }
  console.log(w, "errors:", errs.length ? errs.slice(0, 2) : "none");
  await ctx.close();
}
await b.close();

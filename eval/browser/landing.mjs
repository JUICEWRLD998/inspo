// Screenshots the public landing page. Usage: node eval/browser/landing.mjs [widths...] ; env LANDING_URL, SCHEME
import { launch, BASE } from "./lib.mjs";
const widths = process.argv.slice(2).map(Number).filter(Boolean);
const list = widths.length ? widths : [1280, 375];
const b = await launch();
for (const w of list) {
  const ctx = await b.newContext({ colorScheme: process.env.SCHEME ?? "light", viewport: { width: w, height: w < 768 ? 812 : 800 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource|analytics|SDK Error|Error data|^\{|^\}|"error"/.test(m.text()) && errs.push(m.text()));
  await p.goto(`${process.env.LANDING_URL ?? BASE}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1800);
  await p.screenshot({ path: `eval/shots/landing-${w}${process.env.SCHEME === "dark" ? "-dark" : ""}-fold.png` });
  await p.screenshot({ path: `eval/shots/landing-${w}${process.env.SCHEME === "dark" ? "-dark" : ""}-full.png`, fullPage: true });
  console.log(w, "errors:", errs.length ? errs.slice(0, 3) : "none");
  await ctx.close();
}
await b.close();

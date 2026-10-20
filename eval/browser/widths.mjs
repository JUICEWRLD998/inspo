// The landing page at the eight required widths, light and dark: per-element overflow (not scrollWidth, which overflow-x
// rules can blind) with a planted 2000px control, plus a screenshot of the first viewport and the full page.
// Usage: node eval/browser/widths.mjs   (LANDING_URL / PW_PROXY for a deployed run)
import { launch, BASE } from "./lib.mjs";
const URL = process.env.LANDING_URL ?? BASE;
const b = await launch();
const log = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) process.exitCode = 1; };
const probe = () => document.evaluate ? [...document.querySelectorAll("#root *")].filter((e) => { if (e.closest("svg")) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.right > document.documentElement.clientWidth + 1; }).map((e) => `${e.tagName}.${String(e.className).slice(0, 28)}`) : [];
for (const scheme of ["light", "dark"]) {
  for (const w of [320, 375, 414, 768, 1024, 1280, 1440, 1920]) {
    const ctx = await b.newContext({ ignoreHTTPSErrors: Boolean(process.env.PW_PROXY), colorScheme: scheme, viewport: { width: w, height: w < 768 ? 812 : 900 } });
    const p = await ctx.newPage();
    await p.goto(`${URL}/`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    await p.evaluate(() => { const d = document.createElement("div"); d.id = "__ctl"; d.style.cssText = "width:2000px;height:2px"; document.getElementById("root").appendChild(d); });
    const planted = await p.evaluate(probe);
    await p.evaluate(() => document.getElementById("__ctl").remove());
    if (!planted.some((x) => x.startsWith("DIV"))) { log(false, `[${scheme} ${w}] overflow probe missed its planted 2000px control`); await ctx.close(); continue; }
    const over = await p.evaluate(probe);
    await p.screenshot({ path: `eval/shots/width-${w}-${scheme}.png` });
    log(over.length === 0, `[${scheme} ${String(w).padStart(4)}px] no element pokes past the viewport edge${over.length ? ": " + over.slice(0, 3).join(", ") : ""}`);
    await ctx.close();
  }
}
await b.close();

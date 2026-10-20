// browser-qa for the public landing page: console errors, Core Web Vitals (LCP element, CLS), an axe accessibility pass,
// and image probes. Every probe has a planted control that must register first, and the control is then removed from
// the sample. Headless Chromium on software rendering is not a phone: timings are labelled, never promoted.
// Usage: node eval/browser/qa.mjs   (LANDING_URL / PW_PROXY for a deployed run)
import { launch, BASE } from "./lib.mjs";
import { readFileSync } from "node:fs";
const URL = process.env.LANDING_URL ?? BASE;
const axeSrc = readFileSync("app/node_modules/axe-core/axe.min.js", "utf8");
const b = await launch();
const log = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) process.exitCode = 1; };

async function page(vp, scheme) {
  const ctx = await b.newContext({ ignoreHTTPSErrors: Boolean(process.env.PW_PROXY), colorScheme: scheme, viewport: vp, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await p.addInitScript(() => {
    window.__cls = 0; window.__lcp = null;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => { const e = l.getEntries().at(-1); window.__lcp = { t: e.startTime, tag: e.element?.tagName, src: e.element?.getAttribute?.("src") }; }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  return { ctx, p, errors };
}

for (const [vp, scheme] of [[{ width: 375, height: 812 }, "light"], [{ width: 1280, height: 800 }, "light"], [{ width: 1280, height: 800 }, "dark"]]) {
  const tag = `${vp.width}px ${scheme}`;
  const { ctx, p, errors } = await page(vp, scheme);
  await p.goto(`${URL}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2200);

  // console
  const real = errors.filter((e) => !/Failed to load resource|analytics|SDK Error|Error data|^\{|^\}|"error"/.test(e));
  log(real.length === 0, `[${tag}] no console errors (${real.slice(0, 2).join(" | ") || "none"})`);

  // LCP: the hero photo, and it is not lazy
  const lcp = await p.evaluate(() => window.__lcp);
  log(lcp?.tag === "IMG" && /layer-cake/.test(lcp.src ?? ""), `[${tag}] LCP element is the hero photo (${lcp?.tag} ${lcp?.src}) at ${Math.round(lcp?.t ?? 0)}ms (headless, software rendering)`);

  // CLS with a planted control: an unsized image injected late must move the number
  const clsBefore = await p.evaluate(() => window.__cls);
  await p.evaluate(() => { const i = document.createElement("img"); i.id = "__ctl_cls"; i.src = "/icon.svg"; i.style.cssText = "display:block;width:300px"; document.querySelector("main").prepend(i); });
  await p.waitForTimeout(600);
  const clsPlanted = await p.evaluate(() => window.__cls);
  await p.evaluate(() => document.getElementById("__ctl_cls")?.remove());
  log(clsPlanted > clsBefore + 0.001, `[${tag}] CLS probe registered its planted late image (${clsBefore.toFixed(4)} -> ${clsPlanted.toFixed(4)})`);
  log(clsBefore < 0.1, `[${tag}] CLS during load = ${clsBefore.toFixed(4)} (< 0.1)`);

  // images: broken / alt / oversized, each with a planted control
  const imgs = () => p.evaluate(() => [...document.images].map((i) => ({ id: i.id, src: i.getAttribute("src"), complete: i.complete, nw: i.naturalWidth, alt: i.getAttribute("alt"), rw: i.getBoundingClientRect().width, dpr: devicePixelRatio })));
  await p.evaluate(() => document.body.insertAdjacentHTML("beforeend", '<img id="__ctl_broken" src="/missing-file.png" alt="x" width="10" height="10"><img id="__ctl_noalt" src="/icon.svg" width="10" height="10"><img id="__ctl_big" src="/og.png" alt="x" style="width:100px">'));
  await p.waitForTimeout(800);
  const all = await imgs();
  const broken = (x) => x.complete && x.nw === 0, noalt = (x) => x.alt === null, big = (x) => x.nw / (x.rw * x.dpr) > 2;
  log(all.some((x) => x.id === "__ctl_broken" && broken(x)) && all.some((x) => x.id === "__ctl_noalt" && noalt(x)) && all.some((x) => x.id === "__ctl_big" && big(x)), `[${tag}] image probes caught their planted broken, no-alt and oversized controls`);
  const real2 = all.filter((x) => !x.id.startsWith("__ctl"));
  log(real2.length >= 2 && !real2.some(broken), `[${tag}] no broken images among ${real2.length}`);
  log(!real2.some(noalt), `[${tag}] every image has an alt attribute (decorative ones are alt="")`);
  log(!real2.some((x) => x.rw > 0 && big(x)), `[${tag}] no image is more than 2x oversized (hero ${real2[0]?.nw}px wide)`);
  await p.evaluate(() => document.querySelectorAll('[id^="__ctl"]').forEach((n) => n.remove()));

  // axe: planted control first (an unlabelled button and an image with no alt must be reported)
  await p.addScriptTag({ content: axeSrc });
  await p.evaluate(() => document.body.insertAdjacentHTML("beforeend", '<button id="__ctl_axe"></button><img id="__ctl_axe2" src="/icon.svg" width="10" height="10">'));
  const planted = await p.evaluate(async () => (await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"] })).violations.map((v) => v.id));
  await p.evaluate(() => document.querySelectorAll('[id^="__ctl"]').forEach((n) => n.remove()));
  if (!(planted.includes("button-name") && planted.includes("image-alt"))) { log(false, `[${tag}] axe control missed its planted violations (${planted.join(",")})`); continue; }
  const res = await p.evaluate(async () => (await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"] })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help })));
  const serious = res.filter((v) => v.impact === "serious" || v.impact === "critical");
  log(serious.length === 0, `[${tag}] axe: zero serious or critical violations (${res.length} total: ${res.map((v) => `${v.id}:${v.impact}x${v.n}`).join(", ") || "none"})`);
  await ctx.close();
}
await b.close();

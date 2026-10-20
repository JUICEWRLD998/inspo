// Signature-moment proofs (motion-system.md section 4). Every probe has its planted control.
//  1. Filmstrip: CDP screencast while "Watch it print again" replays the docket; frames tiled with ffmpeg to LOOK at.
//  2. Reduced motion: same end state (text) and the announcement is present.
//  3. Frame times: a rAF sampler, validated first by a planted 80ms busy-wait it must report.
// Usage: node eval/browser/filmstrip.mjs   (env LANDING_URL for a deployed run, PW_PROXY for the container proxy)
import { launch, BASE } from "./lib.mjs";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
const URL = process.env.LANDING_URL ?? BASE;
const out = "eval/shots/filmstrip";
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const log = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) process.exitCode = 1; };
const b = await launch();
const ctxOpts = { ignoreHTTPSErrors: Boolean(process.env.PW_PROXY), colorScheme: "light", viewport: { width: 1280, height: 800 } };

// ---- 1. filmstrip
let ctx = await b.newContext(ctxOpts);
let p = await ctx.newPage();
await p.goto(`${URL}/`, { waitUntil: "networkidle" });
await p.waitForTimeout(2200); // let the load-time print finish
const cdp = await ctx.newCDPSession(p);
const frames = [];
cdp.on("Page.screencastFrame", async (f) => { frames.push({ t: f.metadata.timestamp, data: f.data }); await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); });
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 70, everyNthFrame: 1 });
await p.getByRole("button", { name: "Watch it print again" }).click();
await p.waitForTimeout(1800);
await cdp.send("Page.stopScreencast");
frames.sort((x, y) => x.t - y.t);
const t0 = frames[0]?.t ?? 0;
frames.forEach((f, i) => writeFileSync(`${out}/f-${String(i).padStart(3, "0")}.jpg`, Buffer.from(f.data, "base64")));
console.log(`captured ${frames.length} frames over ${((frames.at(-1).t - t0) * 1000).toFixed(0)}ms`);
log(frames.length >= 6, `screencast produced enough frames to show the beats (${frames.length})`);
const step = Math.max(1, Math.floor(frames.length / 12));
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", "1", "-pattern_type", "glob", "-i", `${out}/f-*.jpg`, "-vf", `select='not(mod(n\\,${step}))',scale=420:-1,tile=4x3`, "-frames:v", "1", `${out}/sheet.jpg`]);
const fullEnd = await p.locator('[aria-labelledby="docket-title"]').innerText();
const fullLive = await p.getByRole("status").filter({ hasText: "Quote ready" }).innerText();
await ctx.close();

// ---- 2. reduced motion
ctx = await b.newContext({ ...ctxOpts, reducedMotion: "reduce" });
p = await ctx.newPage();
await p.goto(`${URL}/`, { waitUntil: "networkidle" });
await p.waitForTimeout(1600);
const reducedEnd = await p.locator('[aria-labelledby="docket-title"]').innerText();
const reducedLive = await p.getByRole("status").filter({ hasText: "Quote ready" }).innerText();
const anim = await p.evaluate(() => [...document.querySelectorAll('[aria-labelledby="docket-title"] *')].map((e) => getComputedStyle(e).animationName).filter((n) => n && n !== "none"));
log(reducedEnd === fullEnd, "reduced-motion end state text equals the full-motion end state");
log(reducedLive === fullLive && /₦47,000/.test(reducedLive), `reduced-motion run still announces the verdict (${reducedLive})`);
log(anim.length > 0 && anim.every((n) => /fade/i.test(n)), `under reduced motion only a fade runs (${[...new Set(anim)].join(", ")})`);
await p.screenshot({ path: `${out}/reduced-end.png` });
await ctx.close();

// ---- 3. frame times with a planted control
ctx = await b.newContext(ctxOpts);
p = await ctx.newPage();
await p.goto(`${URL}/`, { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
const sample = (plant) => p.evaluate(async (plantIt) => {
  const gaps = [];
  let last = performance.now();
  let go = true;
  const tick = (now) => { gaps.push(now - last); last = now; if (go) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  if (plantIt) { await new Promise((r) => setTimeout(r, 120)); const s = performance.now(); while (performance.now() - s < 80); }
  else document.querySelector("button")?.click();
  await new Promise((r) => setTimeout(r, 1500));
  go = false;
  return gaps.slice(1);
}, plant);
const control = await sample(true);
const controlMax = Math.max(...control);
if (controlMax < 50) { log(false, `frame-time sampler is blind: planted 80ms stall read as ${controlMax.toFixed(0)}ms`); await b.close(); process.exit(2); }
log(true, `sampler caught its planted 80ms stall (read ${controlMax.toFixed(0)}ms)`);
await p.getByRole("button", { name: "Watch it print again" }).scrollIntoViewIfNeeded();
const real = await p.evaluate(async () => {
  const gaps = []; let last = performance.now(); let go = true;
  const tick = (now) => { gaps.push(now - last); last = now; if (go) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  [...document.querySelectorAll("button")].find((x) => x.textContent.includes("print again")).click();
  await new Promise((r) => setTimeout(r, 1500));
  go = false;
  return gaps.slice(1);
});
const over = real.filter((g) => g > 33).length;
console.log(`frame times during the print: ${real.length} frames, max ${Math.max(...real).toFixed(1)}ms, ${over} over 33ms (headless software rendering, not a phone or a GPU)`);
await b.close();

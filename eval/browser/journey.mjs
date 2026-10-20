// Click-path audit of the public journey: every control, the state it should leave, and whether it does.
// Usage: node eval/browser/journey.mjs   (LANDING_URL / PW_PROXY for a deployed run)
import { launch, BASE } from "./lib.mjs";
const URL = process.env.LANDING_URL ?? BASE;
const b = await launch();
const log = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) process.exitCode = 1; };
const ctx = await b.newContext({ ignoreHTTPSErrors: Boolean(process.env.PW_PROXY), colorScheme: "light", viewport: { width: 1280, height: 800 } });
const p = await ctx.newPage();
await p.goto(`${URL}/`, { waitUntil: "networkidle" });
await p.waitForTimeout(1800);

// 1. nav anchors scroll their section into view
for (const [name, id] of [["How it works", "how"], ["Prices", "prices"], ["Questions", "questions"]]) {
  await p.locator("header").getByRole("link", { name }).click();
  await p.waitForTimeout(500);
  const top = await p.evaluate((i) => document.getElementById(i).getBoundingClientRect().top, id);
  log(top >= -2 && top < 400, `nav "${name}" scrolls its section to the top of the view (top=${Math.round(top)}px)`);
}
await p.evaluate(() => window.scrollTo(0, 0));

// 2. the CTA: opens in a new tab at the agent's WhatsApp URL, safely
const ctas = p.getByRole("link", { name: /Send us your inspo/ });
log((await ctas.count()) === 2, `two calls to action (hero and closing), one label (${await ctas.count()})`);
const first = ctas.first();
const href = await first.getAttribute("href");
log(/\/api\/apps\/[0-9a-z]+\/agents\/inspo_desk\/whatsapp$/.test(href ?? "") && !/undefined/.test(href ?? ""), `CTA href is the real agent URL with a real app id (${href})`);
log((await first.getAttribute("target")) === "_blank" && /noopener/.test((await first.getAttribute("rel")) ?? ""), "CTA opens a new tab with rel=noopener");
log((await ctas.nth(0).getAttribute("href")) === (await ctas.nth(1).getAttribute("href")), "both calls to action go to the same place");

// 3. replay: the docket prints again AND the verdict is announced again
await p.waitForSelector('[role="status"]:has-text("Quote ready")');
await p.getByRole("button", { name: "Watch it print again" }).click();
const cleared = await p.locator('[role="status"]').filter({ hasText: "Quote ready" }).count();
log(cleared === 0, "replay: the announcement is cleared when it restarts");
await p.waitForSelector('[role="status"]:has-text("Quote ready")', { timeout: 3000 });
log(true, "replay: the verdict is announced again once it settles");

// 4. FAQ: toggles open and closed, one at a time is not forced
const q = p.locator("summary").first();
await q.click();
const open1 = await p.locator("details").first().evaluate((d) => d.open);
await q.click();
const open2 = await p.locator("details").first().evaluate((d) => d.open);
log(open1 === true && open2 === false, "FAQ: a question opens and closes on click");

// 5. maker sign in -> console gate (signed out), brand link returns home
await p.getByRole("link", { name: "Maker sign in" }).first().click();
await p.waitForURL(/\/today$/);
await p.getByRole("heading", { name: "Maker sign in" }).waitFor({ timeout: 8000 });
log(true, "Maker sign in leads to the console's sign-in screen when signed out");
await p.goto(`${URL}/`, { waitUntil: "networkidle" });
log((await p.getByRole("heading", { level: 1 }).innerText()).includes("Send the cake you want"), "the root URL is the public site, not the console");
await b.close();

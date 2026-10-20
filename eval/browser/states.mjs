// Content states of the public landing page, forced by intercepting the data requests: loading, failure with a working
// retry, empty, and the ready state. Plus keyboard access. Usage: node eval/browser/states.mjs
import { launch, BASE } from "./lib.mjs";
const b = await launch();
const log = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) process.exitCode = 1; };
const fresh = async () => {
  const ctx = await b.newContext({ ignoreHTTPSErrors: Boolean(process.env.PW_PROXY), colorScheme: "light", viewport: { width: 1280, height: 800 } });
  return { ctx, page: await ctx.newPage() };
};
const RC = "**/entities/RateCard*";
const url = `${process.env.LANDING_URL ?? BASE}/`;

// loading: hold the request, the skeleton must show and no price may show; then release
{
  const { ctx, page } = await fresh();
  let release;
  const gate = new Promise((r) => (release = r));
  await page.route(RC, async (route) => { await gate; await route.continue(); });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#prices");
  log((await page.locator('[class*="skeleton"]').count()) > 0 && (await page.getByText("Fondant covering").count()) === 0, "loading: skeleton shown, no price shown yet");
  release();
  await page.waitForSelector("text=Fondant covering");
  log(true, "loading: prices appear once the request completes");
  await ctx.close();
}

// failure then retry
{
  const { ctx, page } = await fresh();
  let fail = true;
  await page.route(RC, (route) => (fail ? route.fulfill({ status: 500, body: "boom" }) : route.continue()));
  await page.goto(url, { waitUntil: "networkidle" });
  const alert = page.getByRole("alert").filter({ hasText: "did not load" });
  log((await alert.count()) === 1 && (await page.getByRole("button", { name: "Try again" }).count()) === 1, "error: a plain message and a Try again button");
  fail = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await page.waitForSelector("text=Fondant covering");
  log((await page.getByRole("alert").filter({ hasText: "did not load" }).count()) === 0, "error: Try again recovers and the message goes away");
  await ctx.close();
}

// empty
{
  const { ctx, page } = await fresh();
  await page.route(RC, (route) => route.fulfill({ status: 200, contentType: "application/json", body: "[]" }));
  await page.goto(url, { waitUntil: "networkidle" });
  log((await page.getByText("The price list has not been set up yet.").count()) === 1 && (await page.getByText("Fondant covering").count()) === 0, "empty: says plainly there is no price list, shows no prices");
  const faqNoDeposit = await page.getByText("How much is the deposit?").count();
  log(faqNoDeposit === 0, "empty: FAQ drops the answers that would have quoted a missing number");
  await ctx.close();
}

// ready + keyboard
{
  const { ctx, page } = await fresh();
  await page.goto(url, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim());
  log(first === "Skip to the content", `keyboard: first Tab lands on the skip link (${first})`);
  await page.keyboard.press("Enter");
  const target = await page.evaluate(() => location.hash);
  log(target === "#main", `keyboard: Enter on the skip link jumps to the content (${target})`);
  const summary = page.locator("summary").first();
  await summary.focus();
  await page.keyboard.press("Enter");
  log(await page.locator("details").first().evaluate((d) => d.open), "keyboard: Enter opens a question");
  const focusRing = await summary.evaluate((el) => { const s = getComputedStyle(el); return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2; });
  log(focusRing, "keyboard: the focused question shows a visible ring (>= 2px)");
  // hit-area census, with a planted 20px-tall link that it MUST flag (and then exclude from the real sample)
  const census = () => page.evaluate(() => [...document.querySelectorAll("a, button, summary")].filter((e) => e.getBoundingClientRect().width > 0 && !e.closest('[class*="skip"]')).map((e) => ({ id: e.id, t: (e.textContent || "").trim().slice(0, 24), h: e.getBoundingClientRect().height })).filter((e) => e.h < 40));
  await page.evaluate(() => document.body.insertAdjacentHTML("beforeend", '<a id="__ctl" href="#" style="display:inline-block;height:20px">tiny</a>'));
  const planted = (await census()).some((e) => e.id === "__ctl");
  await page.evaluate(() => document.getElementById("__ctl").remove());
  log(planted, "hit-area census flags its planted 20px control");
  const sizes = (await census()).filter((e) => e.id !== "__ctl");
  const total = await page.evaluate(() => document.querySelectorAll("a, button, summary").length);
  log(sizes.length === 0 && total > 10, `hit areas: all ${total} links, buttons and summaries are at least 40px tall (${sizes.map((s) => `${s.t}=${s.h.toFixed(0)}`).join(", ") || "none short"})`);
  await ctx.close();
}
await b.close();

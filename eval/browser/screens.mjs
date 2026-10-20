// Drives Orders, Rates and Settings, then screenshots every route at the eight required widths and probes for
// horizontal overflow. The overflow probe is trusted only after it catches a planted 3000px-wide element.
import { launch, signedInPage, api, BASE } from "./lib.mjs";
import { mkdirSync } from "node:fs";
mkdirSync("eval/shots", { recursive: true });
const browser = await launch();
let { page, errors, token } = await signedInPage(browser, { width: 390, height: 844 });
const log = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) process.exitCode = 1; };

// ---- Orders
await page.goto(`${BASE}/orders`, { waitUntil: "networkidle" });
await page.waitForSelector("text=Orders");
log((await page.locator("li", { hasText: "Deposit" }).count()) === 1, "Orders shows the one approved order");
await page.getByRole("button", { name: "Deposit received" }).click();
await page.waitForSelector("text=received");
let orders = await api(token, "entities/Order");
log(orders[0].deposit_status === "paid_confirmed_by_maker", "deposit marked received is saved");
await page.getByRole("button", { name: "Start baking" }).click();
await page.waitForSelector("button:has-text('Mark ready')");
orders = await api(token, "entities/Order");
log(orders[0].status === "baking", "status moved to baking and saved");
const cancel = page.getByRole("button", { name: "Cancel order" });
await cancel.click();
orders = await api(token, "entities/Order");
log(orders[0].status === "baking" && (await page.getByRole("button", { name: "Tap again to cancel" }).count()) === 1, "cancel needs a second tap (order still baking)");
await page.screenshot({ path: "eval/shots/orders-390.png", fullPage: true });

// ---- Rates
await page.goto(`${BASE}/rates`, { waitUntil: "networkidle" });
await page.waitForSelector("text=Cake sizes");
const eight = page.locator('input[inputmode="decimal"]').nth(1); // first row price
const original = await eight.inputValue();
await eight.fill("abc");
await page.getByRole("button", { name: "Save rates" }).click();
log(await page.getByRole("alert").filter({ hasText: "enter a price" }).count() > 0, "invalid price is refused with a message");
const stillOld = (await api(token, "entities/RateCard"))[0].tier_prices[0].price;
log(stillOld === 2500000, "nothing was saved after the invalid attempt");
await eight.fill("26,000");
await page.getByRole("button", { name: "Save rates" }).click();
await page.waitForSelector("text=Saved. New quotes use these prices.");
const rc = (await api(token, "entities/RateCard"))[0];
log(rc.tier_prices[0].price === 2600000 && rc.deposit_percent === 70, `6" price saved as 2,600,000 kobo, deposit untouched (was ${original})`);
await page.screenshot({ path: "eval/shots/rates-390.png", fullPage: true });

// ---- Settings
await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
await page.waitForSelector("text=Account");
await page.getByLabel("Payment note").fill("Pay the deposit to the account on my status.");
await page.getByRole("button", { name: "Save" }).click();
await page.waitForSelector("[role=status]:has-text('Saved')");
log((await api(token, "entities/Maker"))[0].bank_or_payment_note.startsWith("Pay the deposit"), "payment note saved");
log(await page.getByText("This studio is sample data").isVisible(), "Settings says plainly that the studio is sample data");
await page.screenshot({ path: "eval/shots/settings-390.png", fullPage: true });
log(errors.length === 0, `no page errors (${errors.slice(0, 2).join(" | ")})`);

// ---- every width, every route
const WIDTHS = [320, 375, 414, 768, 1024, 1280, 1440, 1920];
const ROUTES = ["/today", "/desk", "/orders", "/rates", "/settings"];
const overflow = () => document.documentElement.scrollWidth - window.innerWidth;
await page.close();
for (const w of WIDTHS) {
  const s = await signedInPage(browser, { width: w, height: w < 768 ? 800 : 900 });
  for (const r of ROUTES) {
    await s.page.goto(`${BASE}${r}`, { waitUntil: "networkidle" });
    await s.page.waitForTimeout(250);
    await s.page.screenshot({ path: `eval/shots/${r.slice(1)}-${w}.png`, fullPage: false });
    const extra = await s.page.evaluate(overflow);
    log(extra <= 0, `${r} at ${w}px: no horizontal scroll (${extra}px)`);
  }
  // planted control: a 3000px element must be caught, or the probe is blind
  await s.page.evaluate(() => document.body.insertAdjacentHTML("beforeend", '<div id="__ctl" style="width:3000px;height:1px"></div>'));
  const planted = await s.page.evaluate(overflow);
  if (planted <= 0) { log(false, `overflow probe missed the planted control at ${w}px`); }
  await s.ctx.close();
}
log(true, "overflow probe caught its planted control at every width");
await browser.close();

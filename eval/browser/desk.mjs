// Drives the Desk on a phone viewport: open a flagged quote, confirm Approve is blocked until every flag is
// acknowledged, approve, and verify the Order exists via the API.
import { launch, signedInPage, plantedDisabledProbe, api } from "./lib.mjs";
import { mkdirSync } from "node:fs";
mkdirSync("eval/shots", { recursive: true });
const browser = await launch();
const { page, errors, token } = await signedInPage(browser, { width: 390, height: 844 });
const log = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) process.exitCode = 1; };

await page.goto("/desk".replace(/^/, process.env.CONSOLE_URL ?? "http://localhost:5173"), { waitUntil: "networkidle" });
await page.waitForSelector("text=Waiting for you");
await plantedDisabledProbe(page);
log(true, "disabled-state probe works on planted controls");
await page.screenshot({ path: "eval/shots/desk-list-390.png" });

const rows = page.locator('a[href^="/desk/"]');
log((await rows.count()) === 2, `two pending quotes listed (got ${await rows.count()})`);
log(await page.getByText("Sample data").first().isVisible(), "SAMPLE DATA badge is visible");

// the flagged one is the second seeded quote (3 flags)
await page.locator('a[href^="/desk/"]', { hasText: "to check" }).first().click();
await page.waitForSelector("text=Check these first");
await page.screenshot({ path: "eval/shots/quote-390.png", fullPage: true });
const approve = page.getByRole("button", { name: /^Approve/ });
log(await approve.isDisabled(), "Approve is disabled while flags are unchecked");

const flags = page.locator('button[aria-pressed]');
const n = await flags.count();
log(n >= 2, `flag buttons present (${n})`);
for (let i = 0; i < n; i++) await flags.nth(i).click();
log(!(await approve.isDisabled()), "Approve enables after every flag is acknowledged");

// edit a price: first price input
const first = page.locator('input[aria-label^="Price for"]').first();
const before = await first.inputValue();
await first.fill("99,000");
await first.blur();
await page.waitForTimeout(600);
log(/edit/.test(await page.innerText("body")), `edit is logged on the quote (price ${before} -> 99,000)`);

await approve.click();
await page.waitForSelector("text=Approved. The order is on your calendar.");
await page.screenshot({ path: "eval/shots/approved-390.png", fullPage: true });
const wa = await page.getByRole("link", { name: "Send on WhatsApp" }).getAttribute("href");
log(/^https:\/\/wa\.me\/2348000000002\?text=/.test(wa ?? ""), `WhatsApp link targets the customer (${(wa ?? "").slice(0, 40)}…)`);

const orders = await api(token, "entities/Order");
log(Array.isArray(orders) && orders.length === 1 && orders[0].deposit_status === "unpaid", `one Order created, deposit unpaid (orders: ${orders.length})`);
const quotes = await api(token, "entities/Quote");
log(quotes.filter((q) => q.status === "sent").length === 1, "exactly one quote is now sent");
log(errors.length === 0, `no page errors (${errors.slice(0, 2).join(" | ")})`);
await browser.close();

// Today screen. Control first: with the real clock nothing is due. Then jump the browser clock two days ahead so the
// 24-hour rules fire, and check each reminder, its dedupe, and that "sent" is saved on the order.
import { launch, signedInPage, api, BASE } from "./lib.mjs";
const browser = await launch();
const log = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); if (!ok) process.exitCode = 1; };
const DAY = 864e5;

const s = await signedInPage(browser, { width: 390, height: 900 });
const { page, token } = s;
const customers = await api(token, "entities/Customer");
const [c1, c2] = [customers.find((c) => c.whatsapp_id.endsWith("1")), customers.find((c) => c.whatsapp_id.endsWith("2"))];
const mk = (c, days, paid) => api(token, "entities/Order", { method: "POST", body: JSON.stringify({
  quote_id: "seeded", customer_id: c.id, total: 4900000, deposit_due: 3430000, status: "confirmed",
  deposit_status: paid ? "paid_confirmed_by_maker" : "unpaid", pickup_or_delivery_at: new Date(Date.now() + days * DAY).toISOString().slice(0, 10) + "T00:00:00Z" }) });
const pending = (await api(token, "entities/Quote")).filter((q) => q.status === "pending_approval").length;
const unpaid = await mk(c1, 10, false);
const paid = await mk(c2, 3, true);

// control: now, nothing is old enough or due tomorrow
await page.goto(`${BASE}/today`, { waitUntil: "networkidle" });
await page.waitForSelector("text=Today");
log((await page.getByText("All caught up").count()) === 1, "control: with the real clock nothing is due (list is not always full)");
log(new RegExp(`${pending}\\s+quotes? (is|are) waiting`, "i").test(await page.innerText("main")), `summary counts the ${pending} pending quote(s) from the API`);

// two days later
await page.clock.install({ time: new Date(Date.now() + 2 * DAY) });
await page.goto(`${BASE}/today`, { waitUntil: "networkidle" });
await page.waitForSelector("text=To send today");
await page.waitForTimeout(400);
const text = await page.innerText("main");
const due = (t) => Number((t.match(/to send today · (\d+)/i) ?? [])[1]);
log(due(text) === 2 + pending, `${2 + pending} things due after two days: pickup, deposit and ${pending} waiting quote(s) (page says ${due(text)})`);
log(/pickup tomorrow/i.test(text) && /deposit not received/i.test(text) && /waiting for your price/i.test(text), "one of each kind is listed");
await page.screenshot({ path: "eval/shots/today-390.png", fullPage: true });

// the pickup message carries the balance, deposit chase carries the deposit
const pickupCard = page.locator("li", { hasText: "pickup tomorrow" });
await pickupCard.getByText("See the message").click();
const pickupMsg = await pickupCard.locator("details p").innerText();
log(pickupMsg.includes("₦14,700") && pickupMsg.includes("tomorrow"), "pickup message shows the ₦14,700 balance (49,000 - 34,300)");
const depositCard = page.locator("li", { hasText: "deposit not received" });
await depositCard.getByText("See the message").click();
log((await depositCard.locator("details p").innerText()).includes("₦34,300"), "deposit message shows the ₦34,300 deposit");

// mark deposit sent -> item leaves and is saved
await depositCard.getByRole("button", { name: "Mark as sent" }).click();
await page.waitForFunction((n) => new RegExp(`to send today · ${n}`, "i").test(document.body.innerText), 1 + pending);
let orders = await api(token, "entities/Order");
const saved = orders.find((o) => o.id === unpaid.id);
log(saved.reminders_sent?.length === 1 && saved.reminders_sent[0].kind === "deposit", "deposit reminder recorded on the order");

// WhatsApp link records the pickup reminder and targets the customer
const href = await pickupCard.getByRole("link", { name: "Send on WhatsApp" }).getAttribute("href");
log(/^https:\/\/wa\.me\/2348000000002\?text=/.test(href), "pickup link goes to the right customer");
s.ctx.on("page", (p) => p.close().catch(() => {}));
await pickupCard.getByRole("link", { name: "Send on WhatsApp" }).click();
await page.waitForFunction((n) => new RegExp(`to send today · ${n}`, "i").test(document.body.innerText), pending);
orders = await api(token, "entities/Order");
log(orders.find((o) => o.id === paid.id).reminders_sent?.[0]?.kind === "pickup", "pickup reminder recorded after tapping Send");

// reload: sent ones stay gone (dedupe survives a refresh)
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector("text=To send today");
log(due(await page.innerText("main")) === pending, `after a reload only the ${pending} waiting quote(s) remain`);
const open = page.locator("li", { hasText: "waiting for your price" }).first().getByRole("link", { name: "Open the quote" });
log(/\/desk\/.+/.test(await open.getAttribute("href")), "a waiting quote links to its page");
await browser.close();

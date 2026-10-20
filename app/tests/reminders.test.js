import { describe, it, expect } from "vitest";
import { dueReminders, markSent } from "../src/lib/reminders.js";

const H = 3_600_000;
const NOW = "2026-11-02T10:00:00Z"; // Monday
const ago = (h) => new Date(Date.parse(NOW) - h * H).toISOString();

const customers = { c1: { id: "c1", whatsapp_id: "2348000000001", name: "Ada" }, c2: { id: "c2", whatsapp_id: "2348000000002" } };
const ctx = { customers, brand: "Aminat's Cake Studio", depositPercent: 70, paymentNote: "Pay to the account on my status.", currency: "NGN" };
const order = (over = {}) => ({
  id: "o1", quote_id: "q1", customer_id: "c1", total: 4900000, deposit_due: 3430000, deposit_status: "unpaid",
  status: "confirmed", pickup_or_delivery_at: "2026-11-10T00:00:00Z", created_date: ago(30), reminders_sent: [], ...over,
});
const quote = (over = {}) => ({ id: "q1", status: "sent", ...over });

describe("deposit reminders", () => {
  it("asks for an unpaid deposit once the order is a day old, with her payment note and the amount", () => {
    const [r] = dueReminders({ ...ctx, orders: [order()], quotes: [quote()], now: NOW });
    expect(r).toMatchObject({ kind: "deposit", id: "deposit:o1", phone: "2348000000001" });
    expect(r.message).toContain("₦34,300");
    expect(r.message).toContain("70% deposit");
    expect(r.message).toContain("Pay to the account on my status.");
    expect(r.message).toContain("Aminat's Cake Studio");
  });

  it("waits until the order is 24 hours old", () => {
    expect(dueReminders({ ...ctx, orders: [order({ created_date: ago(23) })], quotes: [], now: NOW })).toEqual([]);
  });

  it("does not chase a paid deposit, a cancelled or collected order, or a past pickup", () => {
    for (const o of [
      order({ deposit_status: "paid_confirmed_by_maker" }),
      order({ status: "cancelled" }),
      order({ status: "collected" }),
      order({ pickup_or_delivery_at: "2026-10-30T00:00:00Z" }),
    ]) expect(dueReminders({ ...ctx, orders: [o], quotes: [], now: NOW })).toEqual([]);
  });

  it("does not repeat within 24 hours of the last one, but does after", () => {
    const sent = (h) => [{ kind: "deposit", at: ago(h) }];
    expect(dueReminders({ ...ctx, orders: [order({ reminders_sent: sent(5) })], quotes: [], now: NOW })).toEqual([]);
    expect(dueReminders({ ...ctx, orders: [order({ reminders_sent: sent(26) })], quotes: [], now: NOW })).toHaveLength(1);
  });
});

describe("pickup reminders", () => {
  const tomorrow = { pickup_or_delivery_at: "2026-11-03T00:00:00Z" };

  it("reminds the day before, with the balance still to pay", () => {
    const [r] = dueReminders({ ...ctx, orders: [order({ ...tomorrow, deposit_status: "paid_confirmed_by_maker" })], quotes: [], now: NOW });
    expect(r).toMatchObject({ kind: "pickup", id: "pickup:o1" });
    expect(r.message).toContain("tomorrow");
    expect(r.message).toContain("₦15,700"); // 49,000 - 34,300
  });

  it("when the deposit is still unpaid it asks for the deposit as well, not a made-up balance", () => {
    const rs = dueReminders({ ...ctx, orders: [order(tomorrow)], quotes: [], now: NOW });
    expect(rs.map((r) => r.kind)).toEqual(["pickup", "deposit"]);
    expect(rs[0].message).toContain("₦49,000");
    expect(rs[0].message).not.toContain("₦15,700");
  });

  it("is not sent for any other day, nor twice", () => {
    expect(dueReminders({ ...ctx, orders: [order({ pickup_or_delivery_at: "2026-11-04T00:00:00Z", deposit_status: "paid_confirmed_by_maker" })], quotes: [], now: NOW })).toEqual([]);
    const done = order({ ...tomorrow, deposit_status: "paid_confirmed_by_maker", reminders_sent: [{ kind: "pickup", at: ago(2) }] });
    expect(dueReminders({ ...ctx, orders: [done], quotes: [], now: NOW })).toEqual([]);
  });
});

describe("quotes waiting for the maker", () => {
  it("lists a pending quote older than 24 hours, with no message to send", () => {
    const [r] = dueReminders({ ...ctx, orders: [], quotes: [quote({ id: "q9", status: "pending_approval", customer_id: "c2", created_date: ago(30) })], now: NOW });
    expect(r).toMatchObject({ kind: "answer", id: "answer:q9", phone: "2348000000002", message: null });
    expect(r.detail).toMatch(/30 hours|1 day/);
  });

  it("ignores a fresh pending quote and answered ones", () => {
    const qs = [quote({ id: "a", status: "pending_approval", created_date: ago(3) }), quote({ id: "b", status: "sent", created_date: ago(50) })];
    expect(dueReminders({ ...ctx, orders: [], quotes: qs, now: NOW })).toEqual([]);
  });
});

describe("ordering and safety", () => {
  it("puts time-critical pickups first, then deposits, then waiting quotes", () => {
    const rs = dueReminders({
      ...ctx, now: NOW,
      orders: [order({ id: "d" }), order({ id: "p", pickup_or_delivery_at: "2026-11-03T00:00:00Z", deposit_status: "paid_confirmed_by_maker" })],
      quotes: [quote({ id: "w", status: "pending_approval", created_date: ago(40) })],
    });
    expect(rs.map((r) => r.kind)).toEqual(["pickup", "deposit", "answer"]);
  });

  it("copes with a customer who is not linked", () => {
    const [r] = dueReminders({ ...ctx, customers: {}, orders: [order()], quotes: [], now: NOW });
    expect(r.phone).toBeNull();
    expect(r.message).toBeTruthy();
  });

  it("does not mutate its inputs", () => {
    const orders = [order()];
    const snap = JSON.stringify(orders);
    dueReminders({ ...ctx, orders, quotes: [], now: NOW });
    expect(JSON.stringify(orders)).toBe(snap);
  });
});

describe("markSent", () => {
  it("appends a dated entry without touching the old ones", () => {
    const o = order({ reminders_sent: [{ kind: "deposit", at: ago(30) }] });
    const next = markSent(o, "deposit", NOW);
    expect(next).toEqual([{ kind: "deposit", at: ago(30) }, { kind: "deposit", at: NOW }]);
    expect(o.reminders_sent).toHaveLength(1);
  });
});

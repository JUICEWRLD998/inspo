import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { priceQuote } from "../base44/functions/priceQuote/pricing.js";

// SAMPLE DATA from data/sample (invented in a ChatGPT conversation; not a real bakery).
const card = JSON.parse(readFileSync(new URL("../../data/sample/rate-card.json", import.meta.url)));
const now = "2026-10-20T10:00:00Z";
const far = "2026-11-20T10:00:00Z";
const K = 100;
const one = (d, over = {}) => ({
  tiers: [{ diameter_in: d, height: "standard", confidence: 1 }],
  finish: "buttercream",
  decorations: [],
  unreadable: false,
  ...over,
});
const dec = (type, quantity = 1) => ({ type, quantity, size: "medium", confidence: 1 });

describe("additive rate cards (sample)", () => {
  it("prices base + flat finish, height and flavour surcharges", () => {
    const q = priceQuote({
      features: one(10, { tiers: [{ diameter_in: 10, height: "tall", confidence: 1 }] }),
      rateCard: card, eventDate: far, now, flavour: "chocolate",
    });
    expect(q.total).toBe((70000 + 15000 + 3000) * K);
    expect(q.complete).toBe(true);
  });

  it("charges fondant as a flat surcharge, not a multiplier", () => {
    const q = priceQuote({ features: one(9, { finish: "fondant" }), rateCard: card, eventDate: far, now, flavour: "vanilla" });
    expect(q.total).toBe((55000 + 10000) * K);
  });

  it("treats vanilla as included and an unknown flavour as needs_check", () => {
    const a = priceQuote({ features: one(6), rateCard: card, eventDate: far, now, flavour: "vanilla" });
    expect(a.total).toBe(25000 * K);
    expect(a.line_items.find((l) => /vanilla/i.test(l.label))).toBeUndefined();
    const b = priceQuote({ features: one(6), rateCard: card, eventDate: far, now, flavour: "ube" });
    expect(b.needs_check).toContain("flavour");
  });

  it("prices a flat decoration once however many the model counted", () => {
    const q = priceQuote({ features: one(8, { decorations: [dec("fresh_flowers", 12)] }), rateCard: card, eventDate: far, now, flavour: "vanilla" });
    expect(q.total).toBe((42000 + 8000) * K);
  });

  it("uses the low end of a price range and asks her to confirm it", () => {
    const q = priceQuote({ features: one(8, { decorations: [dec("piping")] }), rateCard: card, eventDate: far, now, flavour: "vanilla" });
    expect(q.total).toBe((42000 + 5000) * K);
    expect(q.needs_check).toContain("decorations[0].price");
    expect(q.line_items.at(-1).note).toMatch(/12,000/);
  });

  it("adds a percentage rush fee on the cake subtotal and flags availability", () => {
    const q = priceQuote({ features: one(8), rateCard: card, eventDate: "2026-10-21T08:00:00Z", now, flavour: "chocolate" });
    expect(q.line_items.at(-1)).toMatchObject({ label: "Rush order (25%)", amount: 11250 * K });
    expect(q.total).toBe(56250 * K);
    expect(q.needs_check).toEqual(expect.arrayContaining(["rush_availability"]));
  });

  it("prices delivery by zone and flags a zone she has not set", () => {
    const base = { features: one(6), rateCard: card, eventDate: far, now, flavour: "vanilla" };
    expect(priceQuote({ ...base, delivery: "island" }).total).toBe((25000 + 8000) * K);
    expect(priceQuote({ ...base, delivery: true }).needs_check).toContain("delivery_zone");
    expect(priceQuote({ ...base, delivery: "mars" }).needs_check).toContain("delivery_zone");
  });

  it("works out the deposit from her percentage", () => {
    const q = priceQuote({ features: one(8, { decorations: [dec("drip"), dec("topper")] }), rateCard: card, eventDate: far, now, flavour: "vanilla" });
    expect(q.total).toBe(49000 * K);
    expect(q.deposit_due).toBe(34300 * K);
    expect(q.deposit_display).toBe("₦34,300");
  });

  it("flags an event date inside her 48-hour minimum notice", () => {
    const q = priceQuote({ features: one(6), rateCard: card, eventDate: "2026-10-21T10:00:00Z", now, flavour: "vanilla" });
    expect(q.needs_check).toContain("event_date");
  });
});

import { describe, it, expect } from "vitest";
import { priceQuote } from "../base44/functions/priceQuote/pricing.js";

// TEST FIXTURE ONLY. These numbers exercise the arithmetic; they are not the
// maker's rate card and must never be shown to a customer. Her real card
// replaces this once she has supplied it (see implementation.md section 1).
const card = {
  currency: "NGN",
  tier_prices: [
    { diameter_in: 6, price: 2000000 },
    { diameter_in: 8, price: 3000000 },
    { diameter_in: 10, price: 4500000 },
  ],
  height_multiplier: { standard: 1, tall: 1.5 },
  finish_multipliers: { buttercream: 1, fondant: 1.3, semi_naked: 1.1 },
  flavour_surcharges: { red_velvet: 200000 },
  decoration_prices: [
    { type: "sugar_flowers", unit: "each", price: 150000 },
    { type: "topper", unit: "each", price: 300000 },
    { type: "gold_drip", unit: "flat", price: 500000 },
  ],
  rush_fee: { within_days: 3, amount: 1000000 },
  delivery_fee: 400000,
  lead_time_days: 5,
};

const features = {
  tiers: [
    { diameter_in: 8, height: "standard", confidence: 0.9 },
    { diameter_in: 6, height: "tall", confidence: 0.8 },
  ],
  shape: "round",
  finish: "fondant",
  decorations: [
    { type: "sugar_flowers", quantity: 4, size: "small", confidence: 0.9 },
    { type: "gold_drip", quantity: 1, size: "medium", confidence: 0.7 },
  ],
  unreadable: false,
};

const now = "2026-10-20T10:00:00Z";
const far = "2026-11-20T10:00:00Z";

describe("priceQuote", () => {
  it("prices tiers x height x finish, then decorations", () => {
    const q = priceQuote({ features, rateCard: card, eventDate: far, now });
    // 8in: 3000000 * 1 * 1.3 = 3900000 ; 6in tall: 2000000 * 1.5 * 1.3 = 3900000
    // flowers 4 * 150000 = 600000 ; drip 500000
    expect(q.line_items.map((l) => l.amount)).toEqual([3900000, 3900000, 600000, 500000]);
    expect(q.total).toBe(8900000);
    expect(q.needs_check).toEqual([]);
    expect(q.complete).toBe(true);
  });

  it("keeps every amount a positive integer and the lines summing to the total", () => {
    const q = priceQuote({ features, rateCard: card, eventDate: far, now, delivery: true });
    for (const l of q.line_items) {
      expect(Number.isInteger(l.amount)).toBe(true);
      expect(l.amount).toBeGreaterThan(0);
    }
    expect(q.line_items.reduce((s, l) => s + l.amount, 0)).toBe(q.total);
  });

  it("adds a rush fee inside the rush window only", () => {
    const rush = priceQuote({ features, rateCard: card, eventDate: "2026-10-22T10:00:00Z", now });
    const calm = priceQuote({ features, rateCard: card, eventDate: far, now });
    expect(rush.line_items.at(-1)).toMatchObject({ label: "Rush fee", amount: 1000000 });
    expect(rush.total - calm.total).toBe(1000000);
  });

  it("adds delivery only when asked", () => {
    const a = priceQuote({ features, rateCard: card, eventDate: far, now });
    const b = priceQuote({ features, rateCard: card, eventDate: far, now, delivery: true });
    expect(b.total - a.total).toBe(400000);
  });

  it("flags an event date inside the lead time", () => {
    const q = priceQuote({ features, rateCard: card, eventDate: "2026-10-23T10:00:00Z", now });
    expect(q.needs_check).toContain("event_date");
  });

  it("raises needs_check instead of guessing a tier size she does not price", () => {
    const f = { ...features, tiers: [{ diameter_in: 12, height: "standard", confidence: 0.9 }] };
    const q = priceQuote({ features: f, rateCard: card, eventDate: far, now });
    expect(q.needs_check).toContain("tiers[0].diameter_in");
    expect(q.complete).toBe(false);
    expect(q.line_items.find((l) => l.label.includes("12"))).toBeUndefined();
  });

  it("flags an unknown finish and an unpriced decoration", () => {
    const f = {
      ...features,
      finish: "ganache",
      decorations: [{ type: "figurine", quantity: 1, size: "small", confidence: 0.9 }],
    };
    const q = priceQuote({ features: f, rateCard: card, eventDate: far, now });
    expect(q.needs_check).toEqual(expect.arrayContaining(["finish", "decorations[0].type"]));
    expect(q.complete).toBe(false);
  });

  it("flags every field the model was unsure of (confidence below 0.6)", () => {
    const f = {
      ...features,
      tiers: [{ diameter_in: 8, height: "standard", confidence: 0.4 }],
      decorations: [{ type: "topper", quantity: 1, size: "small", confidence: 0.5 }],
    };
    const q = priceQuote({ features: f, rateCard: card, eventDate: far, now });
    expect(q.needs_check).toEqual(expect.arrayContaining(["tiers[0]", "decorations[0]"]));
  });

  it("refuses an unreadable photo: no lines, no total, incomplete", () => {
    const q = priceQuote({ features: { unreadable: true }, rateCard: card, eventDate: far, now });
    expect(q.line_items).toEqual([]);
    expect(q.total).toBe(0);
    expect(q.complete).toBe(false);
    expect(q.needs_check).toContain("unreadable");
  });

  it("adds a flavour surcharge from her card, and flags an unknown flavour", () => {
    const a = priceQuote({ features, rateCard: card, eventDate: far, now, flavour: "red_velvet" });
    const b = priceQuote({ features, rateCard: card, eventDate: far, now, flavour: "ube" });
    expect(a.total).toBe(8900000 + 200000);
    expect(b.needs_check).toContain("flavour");
  });

  it("is deterministic and does not mutate its inputs", () => {
    const snap = JSON.stringify({ features, card });
    const a = priceQuote({ features, rateCard: card, eventDate: far, now });
    const b = priceQuote({ features, rateCard: card, eventDate: far, now });
    expect(a).toEqual(b);
    expect(JSON.stringify({ features, card })).toBe(snap);
  });
});

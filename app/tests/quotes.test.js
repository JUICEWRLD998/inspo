import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  editLine, addLine, removeLine, canApprove, approve, customerMessage, waLink, verifyAgainstEngine,
} from "../src/lib/quotes.js";

const card = JSON.parse(readFileSync(new URL("../../data/sample/rate-card.json", import.meta.url)));
const NOW = "2026-10-20T12:00:00Z";

const quote = () => ({
  id: "q1",
  customer_id: "c1",
  status: "pending_approval",
  currency: "NGN",
  event_date: "2026-11-03T00:00:00Z",
  features: {
    tiers: [{ diameter_in: 8, height: "standard", confidence: 0.9 }],
    finish: "buttercream",
    decorations: [{ type: "drip", quantity: 1, size: "small", confidence: 0.9 }],
    unreadable: false,
  },
  line_items: [
    { label: '8" cake', qty: 1, unit_price: 4200000, amount: 4200000 },
    { label: "drip", qty: 1, unit_price: 300000, amount: 300000 },
  ],
  total: 4500000,
  needs_check: [],
  edit_log: [],
});

describe("editLine", () => {
  it("changes a unit price, recomputes the amount and total, and logs the edit", () => {
    const q = editLine(quote(), 1, { unit_price: 500000 }, NOW);
    expect(q.line_items[1]).toMatchObject({ unit_price: 500000, amount: 500000 });
    expect(q.total).toBe(4700000);
    expect(q.edit_log).toEqual([{ at: NOW, line: "drip", field: "unit_price", from: 300000, to: 500000 }]);
  });

  it("does not mutate its input", () => {
    const q = quote();
    const snap = JSON.stringify(q);
    editLine(q, 0, { qty: 2 }, NOW);
    expect(JSON.stringify(q)).toBe(snap);
  });

  it("rejects non-integer, zero and negative money", () => {
    for (const bad of [0, -1, 1.5, "10", NaN]) {
      expect(() => editLine(quote(), 0, { unit_price: bad }, NOW)).toThrow();
    }
    expect(() => editLine(quote(), 9, { unit_price: 1 }, NOW)).toThrow(/line/i);
  });
});

describe("addLine / removeLine", () => {
  it("adds a custom line and logs it", () => {
    const q = addLine(quote(), { label: "Extra piping", unit_price: 700000 }, NOW);
    expect(q.line_items.at(-1)).toMatchObject({ label: "Extra piping", qty: 1, amount: 700000 });
    expect(q.total).toBe(5200000);
    expect(q.edit_log.at(-1)).toMatchObject({ field: "added", line: "Extra piping", to: 700000 });
  });

  it("removes a line and refuses to remove the last one", () => {
    const q = removeLine(quote(), 1, NOW);
    expect(q.total).toBe(4200000);
    expect(q.edit_log.at(-1)).toMatchObject({ field: "removed", line: "drip", from: 300000 });
    expect(() => removeLine(q, 0, NOW)).toThrow(/last/i);
  });
});

describe("canApprove", () => {
  it("needs a pending quote with lines and a positive total", () => {
    expect(canApprove(quote(), []).ok).toBe(true);
    expect(canApprove({ ...quote(), status: "sent" }, []).ok).toBe(false);
    expect(canApprove({ ...quote(), line_items: [], total: 0 }, []).ok).toBe(false);
  });

  it("blocks approval until every needs_check item is acknowledged", () => {
    const q = { ...quote(), needs_check: ["decorations[0].type", "event_date"] };
    expect(canApprove(q, ["event_date"])).toMatchObject({ ok: false, missing: ["decorations[0].type"] });
    expect(canApprove(q, ["event_date", "decorations[0].type"]).ok).toBe(true);
  });

  it("blocks approval when the lines do not add up to the total", () => {
    expect(canApprove({ ...quote(), total: 1 }, []).ok).toBe(false);
  });
});

describe("approve", () => {
  it("marks the quote sent and creates a confirmed order with the deposit", () => {
    const { quote: q, order } = approve(quote(), { depositPercent: 70, now: NOW });
    expect(q).toMatchObject({ status: "sent", approved_at: NOW, answered_at: NOW });
    expect(order).toEqual({
      quote_id: "q1",
      customer_id: "c1",
      total: 4500000,
      deposit_due: 3150000,
      deposit_status: "unpaid",
      pickup_or_delivery_at: "2026-11-03T00:00:00Z",
      status: "confirmed",
      notes: "",
    });
  });

  it("refuses a quote that is not pending", () => {
    expect(() => approve({ ...quote(), status: "sent" }, { depositPercent: 70, now: NOW })).toThrow();
  });

  it("keeps answered_at if the customer was already answered", () => {
    const { quote: q } = approve({ ...quote(), answered_at: "2026-10-20T11:00:00Z" }, { depositPercent: 70, now: NOW });
    expect(q.answered_at).toBe("2026-10-20T11:00:00Z");
  });
});

describe("customerMessage and waLink", () => {
  it("quotes only numbers that are on the quote", () => {
    const text = customerMessage(quote(), { brand: "Aminat's Cake Studio", depositPercent: 70 });
    expect(text).toContain('8" cake: ₦42,000');
    expect(text).toContain("drip: ₦3,000");
    expect(text).toContain("Total: ₦45,000");
    expect(text).toContain("70% deposit: ₦31,500");
    expect(text).toContain("Aminat's Cake Studio");
  });

  it("builds a wa.me link with digits only and an encoded text", () => {
    const url = waLink("+234 816 621 2274", "Hi there & welcome");
    expect(url).toBe("https://wa.me/2348166212274?text=Hi%20there%20%26%20welcome");
  });

  it("returns null without a usable number", () => {
    expect(waLink("", "x")).toBeNull();
    expect(waLink(undefined, "x")).toBeNull();
  });
});

describe("verifyAgainstEngine", () => {
  it("accepts a quote the engine reproduces", () => {
    const r = verifyAgainstEngine(quote(), card, { flavour: "vanilla", now: NOW });
    expect(r).toMatchObject({ checked: true, matches: true, expected: 4500000 });
  });

  it("catches a total that was changed outside the engine", () => {
    const q = { ...quote(), total: 100, line_items: [{ label: '8" cake', qty: 1, unit_price: 100, amount: 100 }] };
    expect(verifyAgainstEngine(q, card, { flavour: "vanilla", now: NOW })).toMatchObject({ checked: true, matches: false, expected: 4500000 });
  });

  it("does not check a quote the maker has edited, or one without features", () => {
    expect(verifyAgainstEngine({ ...quote(), edit_log: [{}] }, card, { now: NOW }).checked).toBe(false);
    expect(verifyAgainstEngine({ ...quote(), features: null }, card, { now: NOW }).checked).toBe(false);
  });
});

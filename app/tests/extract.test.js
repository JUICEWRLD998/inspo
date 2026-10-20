import { describe, it, expect } from "vitest";
import { normalise } from "../base44/functions/extractFeatures/schema.js";

describe("normalise", () => {
  it("drops any price the model smuggles in", () => {
    const out = normalise({
      tiers: [{ diameter_in: "8", height: "tall", confidence: 1.7, price: 5 }],
      decorations: [{ type: "topper", quantity: 0, size: "small", confidence: -1, cost: 3 }],
      price: 9999,
      unreadable: false,
    });
    expect(JSON.stringify(out)).not.toMatch(/price|cost|9999/);
    expect(out.tiers[0]).toEqual({ diameter_in: 8, height: "tall", confidence: 1 });
    expect(out.decorations[0]).toMatchObject({ quantity: 1, confidence: 0 });
  });

  it("treats junk and unreadable as unreadable", () => {
    expect(normalise(null).unreadable).toBe(true);
    expect(normalise({ unreadable: true }).unreadable).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { explainCheck } from "../src/lib/checks.js";

describe("explainCheck", () => {
  it("explains each flag the engine can raise, numbering from 1", () => {
    expect(explainCheck("tiers[0].diameter_in")).toBe("Tier 1: this size is not on your price list");
    expect(explainCheck("tiers[1]")).toBe("Tier 2: the photo was hard to read, check the size");
    expect(explainCheck("tiers[2].height")).toBe("Tier 3: check whether it is tall");
    expect(explainCheck("decorations[0].type")).toBe("Decoration 1: not on your price list, price it yourself");
    expect(explainCheck("decorations[1]")).toBe("Decoration 2: the photo was hard to read, check it");
    expect(explainCheck("decorations[2].price")).toBe("Decoration 3: your price is a range, pick the amount");
    expect(explainCheck("decorations[0].quantity")).toBe("Decoration 1: check how many");
    expect(explainCheck("event_date")).toBe("Event date: missing or inside your minimum notice");
    expect(explainCheck("rush_availability")).toBe("Rush order: confirm you can fit it in");
    expect(explainCheck("delivery_zone")).toBe("Delivery: the area is not on your price list");
    expect(explainCheck("flavour")).toBe("Flavour: not on your price list");
    expect(explainCheck("finish")).toBe("Finish: not on your price list");
    expect(explainCheck("unreadable")).toBe("The photo could not be read as a cake");
  });

  it("never hides an unknown flag", () => {
    expect(explainCheck("something_new")).toBe("Check: something_new");
  });
});

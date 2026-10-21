import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { describeRateCard } from "../src/lib/describeRates.js";

const card = JSON.parse(readFileSync(new URL("../../data/sample/rate-card.json", import.meta.url)));

describe("describeRateCard", () => {
  const d = describeRateCard(card, { baker: "Aminat" });

  it("lists sizes in inches, smallest first, with display prices", () => {
    expect(d.sizes.map((s) => [s.inches, s.price])).toEqual([[6, "₦25,000"], [7, "₦32,000"], [8, "₦42,000"], [9, "₦55,000"], [10, "₦70,000"]]);
  });

  it("describes add-ons from the card, leaving out zero-cost finishes and calling 0 flavours included", () => {
    expect(d.finishes).toEqual([{ name: "Fondant", price: "+₦10,000" }]);
    expect(d.tall).toBe("+₦15,000");
    expect(d.flavours).toEqual([
      { name: "Vanilla", price: "Included" },
      { name: "Chocolate", price: "+₦3,000" },
      { name: "Red velvet", price: "+₦5,000" },
    ]);
  });

  it("names decorations plainly, flags ranges and per-piece pricing", () => {
    const by = Object.fromEntries(d.decorations.map((x) => [x.name, x]));
    expect(by["Piping"].price).toBe("₦5,000 to ₦12,000");
    expect(by["Custom topper"] ?? by["Topper"]).toMatchObject({ price: "₦4,000", per: "each" });
    expect(by["Sugar flowers"].price).toBe("+₦5,000");
  });

  it("states the rush rule, delivery areas, deposit and notice", () => {
    expect(d.rush).toBe("+25% when the event is within 1 day. Aminat checks there is room first.");
    expect(d.delivery).toEqual([{ area: "Nearby", price: "from ₦3,000" }, { area: "Mainland", price: "from ₦5,000" }, { area: "Island", price: "from ₦8,000" }]);
    expect(d.depositPercent).toBe(70);
    expect(d.noticeDays).toBe(2);
  });

  it("copes with a card that has none of the optional parts", () => {
    const bare = describeRateCard({ currency: "NGN", tier_prices: [{ diameter_in: 8, price: 4200000 }], decoration_prices: [] });
    expect(bare.sizes).toHaveLength(1);
    expect(bare.finishes).toEqual([]);
    expect(bare.rush).toBeNull();
    expect(bare.delivery).toEqual([]);
    expect(bare.depositPercent).toBeNull();
  });
});

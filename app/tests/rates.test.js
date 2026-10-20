import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { toForm, fromForm, DECORATION_TYPES, FINISHES } from "../src/lib/rates.js";
import { priceQuote } from "../base44/functions/priceQuote/pricing.js";

const card = JSON.parse(readFileSync(new URL("../../data/sample/rate-card.json", import.meta.url)));

describe("rate card form", () => {
  it("round-trips the sample card without changing a number", () => {
    const { card: back, errors } = fromForm(toForm(card));
    expect(errors).toEqual([]);
    expect(back.tier_prices).toEqual(card.tier_prices);
    expect(back.finish_surcharges).toEqual(card.finish_surcharges);
    expect(back.height_surcharge).toEqual(card.height_surcharge);
    expect(back.flavour_surcharges).toEqual(card.flavour_surcharges);
    expect(back.decoration_prices).toEqual(card.decoration_prices);
    expect(back.rush_tiers).toEqual(card.rush_tiers);
    expect(back.delivery_zones).toEqual(card.delivery_zones);
    expect(back.deposit_percent).toBe(70);
    expect(back.lead_time_days).toBe(2);
  });

  it("an edited card prices accordingly", () => {
    const form = toForm(card);
    form.tiers.find((t) => t.diameter === "8").price = "45,000";
    const { card: edited } = fromForm(form);
    const features = { tiers: [{ diameter_in: 8, height: "standard", confidence: 1 }], finish: "buttercream", decorations: [], unreadable: false };
    const q = priceQuote({ features, rateCard: { ...card, ...edited }, eventDate: "2026-12-01T00:00:00Z", now: "2026-10-20T00:00:00Z", flavour: "vanilla" });
    expect(q.total).toBe(4500000);
  });

  it("rejects bad input with a message per problem and returns no card", () => {
    const form = toForm(card);
    form.tiers[0].price = "abc";
    form.tiers[1].diameter = "9"; // collides with the existing 9"
    form.decorations[0].type = "unicorn";
    form.depositPercent = "150";
    form.flavours.push({ key: "  ", price: "1000" });
    const { card: out, errors } = fromForm(form);
    expect(out).toBeNull();
    expect(errors.join("|")).toMatch(/price/i);
    expect(errors.join("|")).toMatch(/twice|duplicate/i);
    expect(errors.join("|")).toMatch(/decoration type/i);
    expect(errors.join("|")).toMatch(/deposit/i);
    expect(errors.join("|")).toMatch(/name/i);
  });

  it("normalises names to the keys the agent and engine use", () => {
    const form = toForm(card);
    form.flavours.push({ key: "Salted Caramel", price: "2,000" });
    const { card: out } = fromForm(form);
    expect(out.flavour_surcharges.salted_caramel).toBe(200000);
  });

  it("a price range needs its top end to be above its low end", () => {
    const form = toForm(card);
    const piping = form.decorations.find((d) => d.type === "piping");
    piping.max = "4000";
    expect(fromForm(form).errors.join("|")).toMatch(/range/i);
  });

  it("exposes the decoration types the photo reader can return", () => {
    for (const t of ["sugar_flowers", "fresh_flowers", "topper", "drip", "piping", "edible_print"]) expect(DECORATION_TYPES).toContain(t);
    expect(FINISHES).toContain("fondant");
  });
});

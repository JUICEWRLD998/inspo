import { it, expect } from "vitest";
import { readFileSync } from "node:fs";

it("saveQuote carries the same pricing engine as priceQuote", () => {
  const read = (f) => readFileSync(new URL(f, import.meta.url), "utf8");
  expect(read("../base44/functions/saveQuote/pricing.js")).toBe(read("../base44/functions/priceQuote/pricing.js"));
});

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { checkImageUrl, checkQuoteInput, FLOOD_LIMIT, tooManyRecent } from "../base44/functions/saveQuote/guard.js";

const ok = "https://media.base44.com/images/private/abc/photo.jpg?token=x";

describe("checkImageUrl", () => {
  it("accepts the WhatsApp media host over https", () => expect(checkImageUrl(ok)).toEqual({ ok: true }));
  it.each([
    ["http://media.base44.com/a.jpg", "http"],
    ["https://169.254.169.254/latest/meta-data", "metadata address"],
    ["https://localhost/a.jpg", "localhost"],
    ["https://127.0.0.1/a.jpg", "loopback"],
    ["https://10.0.0.5/a.jpg", "private range"],
    ["https://media.base44.com.evil.test/a.jpg", "lookalike host"],
    ["https://evil.test/https://media.base44.com/a.jpg", "host buried in the path"],
    ["https://user@evil.test/a.jpg", "credentials in the url"],
    ["file:///etc/passwd", "file scheme"],
    ["not a url", "garbage"],
    [42, "not a string"],
  ])("refuses %s (%s)", (u) => expect(checkImageUrl(u).ok).toBe(false));
});

describe("checkQuoteInput", () => {
  const good = { features: { tiers: [] }, image_url: ok, rate_card_id: "r1", event_date: "2026-11-03", flavour: "red_velvet", delivery: "island" };
  it("accepts what the agent sends", () => expect(checkQuoteInput(good)).toEqual({ ok: true, errors: [] }));
  it("lists every problem at once", () => {
    const r = checkQuoteInput({ features: "x", image_url: "http://x", rate_card_id: 5, event_date: "soon", flavour: {}, delivery: 3 });
    expect(r.ok).toBe(false);
    expect(r.errors.length).toBe(6);
  });
  it("caps oversized feature payloads", () => {
    expect(checkQuoteInput({ ...good, features: { blob: "x".repeat(60_000) } }).ok).toBe(false);
  });
});

describe("flood cap", () => {
  const now = Date.parse("2026-11-03T12:00:00Z");
  const at = (min) => ({ created_date: new Date(now - min * 60_000).toISOString() });
  it("lets a normal day through", () => expect(tooManyRecent([at(1), at(5), at(90)], now)).toBe(false));
  it("trips on a burst inside the hour", () => {
    expect(tooManyRecent(Array.from({ length: FLOOD_LIMIT }, () => at(2)), now)).toBe(true);
  });
  it("ignores old quotes", () => expect(tooManyRecent(Array.from({ length: FLOOD_LIMIT + 5 }, () => at(300)), now)).toBe(false));
});

it("extractFeatures carries the same image-url guard", () => {
  const read = (f) => readFileSync(new URL(f, import.meta.url), "utf8");
  expect(read("../base44/functions/extractFeatures/guard.js")).toBe(read("../base44/functions/saveQuote/guard.js"));
});

import { it, expect } from "vitest";
import { compact } from "../base44/functions/saveQuote/compact.js";

it("drops null and undefined so typed entity fields are omitted, not rejected", () => {
  expect(compact({ a: 1, b: null, c: undefined, d: 0, e: "", f: false, g: [] })).toEqual({ a: 1, d: 0, e: "", f: false, g: [] });
});

it("does not mutate its input", () => {
  const o = { a: null };
  compact(o);
  expect(o).toEqual({ a: null });
});

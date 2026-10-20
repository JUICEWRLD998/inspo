import { describe, it, expect } from "vitest";
import { toMinor, toMajorString } from "../src/lib/money.js";

describe("toMinor", () => {
  it("turns what a person types into whole minor units", () => {
    expect(toMinor("42000")).toBe(4200000);
    expect(toMinor("42,000")).toBe(4200000);
    expect(toMinor("₦42,000.50")).toBe(4200050);
    expect(toMinor(" 3000 ")).toBe(300000);
  });

  it("avoids floating point drift", () => {
    expect(toMinor("0.29")).toBe(29);
    expect(toMinor("1.15")).toBe(115);
    expect(toMinor("19.99")).toBe(1999);
  });

  it("returns null for anything that is not a positive amount", () => {
    for (const bad of ["", "abc", "-5", "0", "1.234", "1e3", null, undefined]) expect(toMinor(bad)).toBeNull();
  });
});

describe("toMinor allowZero", () => {
  it("accepts 0 only when asked, for 'included' prices", () => {
    expect(toMinor("0")).toBeNull();
    expect(toMinor("0", { allowZero: true })).toBe(0);
    expect(toMinor("", { allowZero: true })).toBeNull();
    expect(toMinor("-1", { allowZero: true })).toBeNull();
  });
});

describe("toMajorString", () => {
  it("round-trips with toMinor, dropping needless decimals", () => {
    expect(toMajorString(4200000)).toBe("42000");
    expect(toMajorString(4200050)).toBe("42000.50");
    expect(toMinor(toMajorString(4200050))).toBe(4200050);
  });

  it("is empty for a missing value", () => {
    expect(toMajorString(null)).toBe("");
    expect(toMajorString(undefined)).toBe("");
  });
});

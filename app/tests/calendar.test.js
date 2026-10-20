import { describe, it, expect } from "vitest";
import { dayKey, groupByDay, splitUpcoming, nextStatus, stripDays } from "../src/lib/calendar.js";

const o = (id, at, status = "confirmed") => ({ id, pickup_or_delivery_at: at, status });

describe("dayKey", () => {
  it("is the UTC calendar day, or null without a date", () => {
    expect(dayKey("2026-11-03T23:30:00Z")).toBe("2026-11-03");
    expect(dayKey("2026-11-03T00:00:00Z")).toBe("2026-11-03");
    expect(dayKey(undefined)).toBeNull();
    expect(dayKey("not a date")).toBeNull();
  });
});

describe("groupByDay", () => {
  it("sorts days ascending, orders within a day by time, and puts undated orders last", () => {
    const groups = groupByDay([
      o(1, "2026-11-05T10:00:00Z"),
      o(2, "2026-11-03T15:00:00Z"),
      o(3, "2026-11-03T09:00:00Z"),
      o(4, undefined),
    ]);
    expect(groups.map((g) => g.day)).toEqual(["2026-11-03", "2026-11-05", null]);
    expect(groups[0].orders.map((x) => x.id)).toEqual([3, 2]);
  });

  it("returns nothing for no orders", () => {
    expect(groupByDay([])).toEqual([]);
  });
});

describe("splitUpcoming", () => {
  it("keeps today and later as upcoming, earlier days as past, undated as upcoming", () => {
    const groups = groupByDay([o(1, "2026-11-01T10:00:00Z"), o(2, "2026-11-03T10:00:00Z"), o(3, undefined)]);
    const { upcoming, past } = splitUpcoming(groups, "2026-11-03T08:00:00Z");
    expect(upcoming.map((g) => g.day)).toEqual(["2026-11-03", null]);
    expect(past.map((g) => g.day)).toEqual(["2026-11-01"]);
  });
});

describe("nextStatus", () => {
  it("walks confirmed, baking, ready, collected and then stops", () => {
    expect(nextStatus("confirmed")).toBe("baking");
    expect(nextStatus("baking")).toBe("ready");
    expect(nextStatus("ready")).toBe("collected");
    expect(nextStatus("collected")).toBeNull();
    expect(nextStatus("cancelled")).toBeNull();
    expect(nextStatus("???")).toBeNull();
  });
});

describe("stripDays", () => {
  it("lists consecutive days from today with how many orders fall on each", () => {
    const groups = groupByDay([o(1, "2026-11-03T10:00:00Z"), o(2, "2026-11-03T12:00:00Z"), o(3, "2026-11-05T10:00:00Z")]);
    const s = stripDays(groups, "2026-11-03T08:00:00Z", 4);
    expect(s.map((d) => d.day)).toEqual(["2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"]);
    expect(s.map((d) => d.count)).toEqual([2, 0, 1, 0]);
  });
});

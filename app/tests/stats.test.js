import { describe, it, expect } from "vitest";
import { computeStats } from "../base44/functions/publicStats/stats.js";

const NOW = "2026-11-10T12:00:00Z";
const q = (created, answered, status = "sent") => ({ created_date: created, answered_at: answered, status });

describe("computeStats", () => {
  it("reports zero and no median when nothing has been answered", () => {
    expect(computeStats([], [], NOW)).toEqual({ quotesAnswered: 0, medianReplyMinutes: null, ordersThisWeek: 0 });
    expect(computeStats([q("2026-11-10T10:00:00Z", undefined, "pending_approval")], [], NOW).quotesAnswered).toBe(0);
  });

  it("counts answered quotes and takes the median reply time in minutes", () => {
    const quotes = [
      q("2026-11-09T10:00:00Z", "2026-11-09T10:10:00Z"), // 10
      q("2026-11-09T11:00:00Z", "2026-11-09T11:30:00Z"), // 30
      q("2026-11-09T12:00:00Z", "2026-11-09T13:00:00Z"), // 60
    ];
    expect(computeStats(quotes, [], NOW)).toMatchObject({ quotesAnswered: 3, medianReplyMinutes: 30 });
  });

  it("averages the middle two for an even count", () => {
    const quotes = [q("2026-11-09T10:00:00Z", "2026-11-09T10:10:00Z"), q("2026-11-09T10:00:00Z", "2026-11-09T10:30:00Z")];
    expect(computeStats(quotes, [], NOW).medianReplyMinutes).toBe(20);
  });

  it("ignores declined quotes and ones answered before they were created", () => {
    const quotes = [q("2026-11-09T10:00:00Z", "2026-11-09T10:10:00Z", "declined"), q("2026-11-09T10:00:00Z", "2026-11-09T09:00:00Z")];
    expect(computeStats(quotes, [], NOW).quotesAnswered).toBe(0);
  });

  it("counts only orders from the last seven days, and returns no personal data", () => {
    const orders = [{ created_date: "2026-11-09T00:00:00Z", customer_id: "x" }, { created_date: "2026-11-01T00:00:00Z" }, { created_date: "2026-11-03T12:00:01Z" }];
    const out = computeStats([], orders, NOW);
    expect(out.ordersThisWeek).toBe(2);
    expect(Object.keys(out).sort()).toEqual(["medianReplyMinutes", "ordersThisWeek", "quotesAnswered"]);
  });
});

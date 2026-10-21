import { describe, it, expect } from "vitest";
import { computeStats, computeLive } from "../base44/functions/publicStats/stats.js";

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

  it("never counts a quote marked as a test, nor the orders that came from it", () => {
    const quotes = [
      { id: "real", created_date: "2026-11-09T10:00:00Z", answered_at: "2026-11-09T10:20:00Z", status: "sent" },
      { id: "test", created_date: "2026-11-09T10:00:00Z", answered_at: "2026-11-09T10:01:00Z", status: "sent", is_test: true },
    ];
    const orders = [
      { quote_id: "real", created_date: "2026-11-09T11:00:00Z" },
      { quote_id: "test", created_date: "2026-11-09T11:00:00Z" },
    ];
    const out = computeStats(quotes, orders, NOW);
    expect(out).toEqual({ quotesAnswered: 1, medianReplyMinutes: 20, ordersThisWeek: 1 });
  });
});

describe("computeLive", () => {
  const q = (id, created, answered, extra = {}) => ({ id, created_date: created, answered_at: answered, status: answered ? "sent" : "pending_approval", needs_check: [], edit_log: [], ...extra });

  it("reports honest zeros and nulls when there is no real activity", () => {
    const out = computeLive([], [], NOW);
    expect(out).toMatchObject({ quotesReceived: 0, quotesAnswered: 0, approvals: 0, declined: 0, ordersCreated: 0, depositsConfirmed: 0, medianReplyMinutes: null, editRate: null, needsCheckRate: null, excludedTestQuotes: 0 });
  });

  it("counts real quotes, approvals, edits and checks, and reports the test quotes it left out", () => {
    const quotes = [
      q("a", "2026-11-08T10:00:00Z", "2026-11-08T10:10:00Z", { edit_log: [{}] }),
      q("b", "2026-11-08T11:00:00Z", "2026-11-08T11:30:00Z", { needs_check: ["event_date"] }),
      q("c", "2026-11-09T09:00:00Z", undefined),
      { ...q("d", "2026-11-09T09:00:00Z", undefined), status: "declined" },
      q("t1", "2026-11-09T09:00:00Z", "2026-11-09T09:01:00Z", { is_test: true }),
    ];
    const orders = [
      { quote_id: "a", created_date: "2026-11-08T10:11:00Z", deposit_status: "paid_confirmed_by_maker" },
      { quote_id: "b", created_date: "2026-11-08T11:31:00Z", deposit_status: "unpaid" },
      { quote_id: "t1", created_date: "2026-11-09T09:02:00Z", deposit_status: "paid_confirmed_by_maker" },
    ];
    expect(computeLive(quotes, orders, NOW)).toMatchObject({
      quotesReceived: 4, quotesAnswered: 2, approvals: 2, declined: 1, medianReplyMinutes: 20,
      editRate: 0.5, needsCheckRate: 0.25, ordersCreated: 2, depositsConfirmed: 1, excludedTestQuotes: 1,
    });
  });
});

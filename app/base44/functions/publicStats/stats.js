// Counts only: nothing here can identify a customer. "Answered" means the maker approved the quote.
// A quote the maker marked is_test (our own checks, a friend's trial) is never counted, and neither are its orders.
const MIN = 60_000;
const DAY = 86_400_000;

function split(quotes, orders) {
  const testIds = new Set(quotes.filter((q) => q.is_test).map((q) => q.id));
  return {
    real: quotes.filter((q) => !q.is_test),
    realOrders: orders.filter((o) => !testIds.has(o.quote_id)),
    excluded: testIds.size,
  };
}

function median(sorted) {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  const m = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(m);
}

function replyWaits(quotes) {
  return quotes
    .filter((q) => q.status === "sent" && q.answered_at && q.created_date)
    .map((q) => (Date.parse(q.answered_at) - Date.parse(q.created_date)) / MIN)
    .filter((m) => m >= 0)
    .sort((a, b) => a - b);
}

export function computeStats(quotes, orders, nowIso) {
  const now = Date.parse(nowIso);
  const { real, realOrders } = split(quotes, orders);
  const waits = replyWaits(real);
  return {
    quotesAnswered: waits.length,
    medianReplyMinutes: median(waits),
    ordersThisWeek: realOrders.filter((o) => now - Date.parse(o.created_date) <= 7 * DAY && Date.parse(o.created_date) <= now).length,
  };
}

// The full P7 ledger. Rates are null (not 0) when there is nothing to divide by.
export function computeLive(quotes, orders, nowIso) {
  const { real, realOrders, excluded } = split(quotes, orders);
  const waits = replyWaits(real);
  const sent = real.filter((q) => q.status === "sent");
  const rate = (n, d) => (d === 0 ? null : n / d);
  return {
    asOf: nowIso,
    quotesReceived: real.length,
    quotesAnswered: waits.length,
    approvals: sent.length,
    declined: real.filter((q) => q.status === "declined").length,
    medianReplyMinutes: median(waits),
    editRate: rate(sent.filter((q) => (q.edit_log || []).length > 0).length, sent.length),
    needsCheckRate: rate(real.filter((q) => (q.needs_check || []).length > 0).length, real.length),
    ordersCreated: realOrders.length,
    depositsConfirmed: realOrders.filter((o) => o.deposit_status === "paid_confirmed_by_maker").length,
    excludedTestQuotes: excluded,
  };
}

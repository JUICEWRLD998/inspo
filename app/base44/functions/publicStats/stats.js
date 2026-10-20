// Counts only: nothing here can identify a customer. "Answered" means the maker approved the quote.
const MIN = 60_000;
const DAY = 86_400_000;

export function computeStats(quotes, orders, nowIso) {
  const now = Date.parse(nowIso);
  const waits = quotes
    .filter((q) => q.status === "sent" && q.answered_at && q.created_date)
    .map((q) => (Date.parse(q.answered_at) - Date.parse(q.created_date)) / MIN)
    .filter((m) => m >= 0)
    .sort((a, b) => a - b);
  const mid = Math.floor(waits.length / 2);
  const median = waits.length === 0 ? null : waits.length % 2 ? waits[mid] : (waits[mid - 1] + waits[mid]) / 2;
  return {
    quotesAnswered: waits.length,
    medianReplyMinutes: median === null ? null : Math.round(median),
    ordersThisWeek: orders.filter((o) => now - Date.parse(o.created_date) <= 7 * DAY && Date.parse(o.created_date) <= now).length,
  };
}

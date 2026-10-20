// Bake calendar grouping. Days are UTC calendar days, matching how event dates are stored.
export function dayKey(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}

export function groupByDay(orders) {
  const byDay = new Map();
  for (const order of orders) {
    const key = dayKey(order.pickup_or_delivery_at);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(order);
  }
  const at = (x) => Date.parse(x.pickup_or_delivery_at) || 0;
  return [...byDay.entries()]
    .map(([day, list]) => ({ day, orders: list.sort((a, b) => at(a) - at(b)) }))
    .sort((a, b) => (a.day === null) - (b.day === null) || String(a.day).localeCompare(String(b.day)));
}

export function splitUpcoming(groups, nowIso) {
  const today = dayKey(nowIso);
  const isPast = (g) => g.day !== null && g.day < today;
  return { upcoming: groups.filter((g) => !isPast(g)), past: groups.filter(isPast) };
}

const FLOW = ["confirmed", "baking", "ready", "collected"];
export function nextStatus(status) {
  const i = FLOW.indexOf(status);
  return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : null;
}

export function stripDays(groups, nowIso, count = 14) {
  const counts = new Map(groups.map((g) => [g.day, g.orders.length]));
  const start = Date.parse(`${dayKey(nowIso)}T00:00:00Z`);
  return Array.from({ length: count }, (_, i) => {
    const day = new Date(start + i * 86_400_000).toISOString().slice(0, 10);
    return { day, count: counts.get(day) ?? 0 };
  });
}

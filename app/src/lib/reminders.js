// What is due today, worked out from the records. Pure: it sends nothing and has no clock of its own, so the same
// rules can run in the console now, or in a scheduled Workflow later (Workflows needs a paid Base44 plan).
import { display } from "../../base44/functions/priceQuote/pricing.js";
import { dayKey } from "./calendar.js";

const H = 3_600_000;
const DONE = new Set(["cancelled", "collected"]);
const ORDER = { pickup: 0, deposit: 1, answer: 2 };

const hoursSince = (iso, now) => (Date.parse(now) - Date.parse(iso)) / H;
const lastSent = (o, kind) => (o.reminders_sent ?? []).filter((r) => r.kind === kind).map((r) => r.at).sort().at(-1);
const sentWithin = (o, kind, hours, now) => {
  const at = lastSent(o, kind);
  return at !== undefined && hoursSince(at, now) < hours;
};
const dateLabel = (iso) => new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const nextDay = (key) => new Date(Date.parse(`${key}T00:00:00Z`) + 24 * H).toISOString().slice(0, 10);

export function dueReminders({ orders, quotes, customers, now, brand, depositPercent, paymentNote, currency = "NGN" }) {
  const today = dayKey(now);
  const out = [];
  const money = (n) => display(n, currency);
  const greet = (c) => (c?.name ? `Hi ${c.name}!` : "Hi!");

  for (const o of orders) {
    if (DONE.has(o.status)) continue;
    const c = customers[o.customer_id];
    const phone = c?.whatsapp_id ?? null;
    const pickupDay = dayKey(o.pickup_or_delivery_at);
    const paid = o.deposit_status === "paid_confirmed_by_maker";

    if (pickupDay && pickupDay === nextDay(today) && !sentWithin(o, "pickup", 20, now)) {
      const tail = paid
        ? `The remaining balance is ${money(o.total - o.deposit_due)}.`
        : `The total is ${money(o.total)}, and the ${depositPercent}% deposit is still to be paid.`;
      out.push({
        id: `pickup:${o.id}`, kind: "pickup", orderId: o.id, phone,
        title: `${c?.name ?? "Customer"}: pickup tomorrow`,
        detail: dateLabel(o.pickup_or_delivery_at),
        message: `${greet(c)} This is ${brand}. Your cake is ready for you tomorrow (${dateLabel(o.pickup_or_delivery_at)}).\n\n${tail}${paymentNote ? `\n\n${paymentNote}` : ""}`,
      });
    }

    const stillAhead = pickupDay === null || pickupDay >= today;
    if (!paid && stillAhead && hoursSince(o.created_date, now) >= 24 && !sentWithin(o, "deposit", 24, now)) {
      out.push({
        id: `deposit:${o.id}`, kind: "deposit", orderId: o.id, phone,
        title: `${c?.name ?? "Customer"}: deposit not received`,
        detail: `${money(o.deposit_due)} for ${o.pickup_or_delivery_at ? dateLabel(o.pickup_or_delivery_at) : "an unscheduled date"}`,
        message: `${greet(c)} A quick reminder from ${brand}.\n\nTo confirm your cake${o.pickup_or_delivery_at ? ` for ${dateLabel(o.pickup_or_delivery_at)}` : ""}, the ${depositPercent}% deposit of ${money(o.deposit_due)} is still to be paid.${paymentNote ? `\n\n${paymentNote}` : ""}\n\nThank you!`,
      });
    }
  }

  for (const q of quotes) {
    if (q.status !== "pending_approval") continue;
    const age = hoursSince(q.created_date, now);
    if (!(age >= 24)) continue;
    const c = customers[q.customer_id];
    const h = Math.floor(age);
    out.push({
      id: `answer:${q.id}`, kind: "answer", quoteId: q.id, phone: c?.whatsapp_id ?? null,
      title: `${c?.name ?? "A customer"} is waiting for a price`,
      detail: `Waiting ${h < 48 ? `${h} hours` : `${Math.floor(h / 24)} days`}`,
      message: null,
    });
  }

  return out.sort((a, b) => ORDER[a.kind] - ORDER[b.kind]);
}

export const markSent = (order, kind, now) => [...(order.reminders_sent ?? []), { kind, at: now }];

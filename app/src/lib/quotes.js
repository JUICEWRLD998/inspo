// Pure quote logic for the maker console: editing, approving, messaging. No network, no clock of its own.
// Money is an integer in the smallest currency unit, same as the pricing engine.
import { display, priceQuote } from "../../base44/functions/priceQuote/pricing.js";

const isMoney = (n) => Number.isInteger(n) && n > 0;
const sum = (lines) => lines.reduce((s, l) => s + l.amount, 0);

function rebuilt(quote, lines, logEntry) {
  const line_items = lines.map((l) => ({ ...l, amount: l.qty * l.unit_price }));
  return {
    ...quote,
    line_items,
    total: sum(line_items),
    edit_log: [...(quote.edit_log ?? []), logEntry],
  };
}

export function editLine(quote, index, patch, now) {
  const line = quote.line_items[index];
  if (!line) throw new Error(`No such line: ${index}`);
  const field = Object.keys(patch)[0];
  if (!["label", "qty", "unit_price"].includes(field)) throw new Error(`Cannot edit ${field}`);
  const value = patch[field];
  if (field === "label") {
    if (typeof value !== "string" || !value.trim()) throw new Error("A line needs a label");
  } else if (!isMoney(value)) {
    throw new Error(`${field} must be a positive whole number`);
  }
  const lines = quote.line_items.map((l, i) => (i === index ? { ...l, [field]: value } : l));
  return rebuilt(quote, lines, { at: now, line: line.label, field, from: line[field], to: value });
}

export function addLine(quote, { label, unit_price }, now) {
  if (typeof label !== "string" || !label.trim()) throw new Error("A line needs a label");
  if (!isMoney(unit_price)) throw new Error("unit_price must be a positive whole number");
  const lines = [...quote.line_items, { label: label.trim(), qty: 1, unit_price, amount: unit_price }];
  return rebuilt(quote, lines, { at: now, line: label.trim(), field: "added", from: null, to: unit_price });
}

export function removeLine(quote, index, now) {
  const line = quote.line_items[index];
  if (!line) throw new Error(`No such line: ${index}`);
  if (quote.line_items.length === 1) throw new Error("Cannot remove the last line");
  const lines = quote.line_items.filter((_, i) => i !== index);
  return rebuilt(quote, lines, { at: now, line: line.label, field: "removed", from: line.amount, to: null });
}

export function canApprove(quote, acknowledged) {
  const reasons = [];
  if (quote.status !== "pending_approval") reasons.push("Only a pending quote can be approved");
  if (!quote.line_items?.length || !(quote.total > 0)) reasons.push("The quote has no price");
  else if (sum(quote.line_items) !== quote.total) reasons.push("The lines do not add up to the total");
  const missing = (quote.needs_check ?? []).filter((f) => !acknowledged.includes(f));
  if (missing.length) reasons.push("Check the flagged items first");
  return { ok: reasons.length === 0, reasons, missing };
}

export function approve(quote, { depositPercent, now }) {
  const verdict = canApprove(quote, quote.needs_check ?? []);
  if (quote.status !== "pending_approval") throw new Error("Only a pending quote can be approved");
  if (!verdict.ok && verdict.reasons.some((r) => r !== "Check the flagged items first")) {
    throw new Error(verdict.reasons[0]);
  }
  return {
    quote: { ...quote, status: "sent", approved_at: now, answered_at: quote.answered_at ?? now },
    order: {
      quote_id: quote.id,
      customer_id: quote.customer_id,
      total: quote.total,
      deposit_due: Math.round((quote.total * depositPercent) / 100),
      deposit_status: "unpaid",
      pickup_or_delivery_at: quote.event_date,
      status: "confirmed",
      notes: "",
    },
  };
}

const dateLabel = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function customerMessage(quote, { brand, depositPercent, paymentNote }) {
  const cur = quote.currency;
  const lines = quote.line_items.map((l) => `- ${l.label}: ${display(l.amount, cur)}`);
  const out = [`Hi! This is ${brand}.`, "", "Your quote is confirmed:", ...lines, "", `Total: ${display(quote.total, cur)}`];
  if (depositPercent) {
    const dep = Math.round((quote.total * depositPercent) / 100);
    out.push(`${depositPercent}% deposit: ${display(dep, cur)} to confirm your order.`);
  }
  if (quote.event_date) out.push(`For: ${dateLabel(quote.event_date)}`);
  if (paymentNote) out.push("", paymentNote);
  return out.join("\n");
}

export function waLink(phone, text) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.length < 7) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

const keyOf = (s) => s.trim().toLowerCase().replace(/\s+/g, "_");

// Re-price the stored features and compare. A total changed outside the engine (a tampered or buggy write)
// shows up here. Skipped once the maker has edited lines, since then the total is hers by design.
export function verifyAgainstEngine(quote, rateCard, { flavour, delivery, now } = {}) {
  if (!quote.features || quote.edit_log?.length) return { checked: false };
  const lines = quote.line_items ?? [];
  const fromLabel = (prefix) => lines.find((l) => l.label.startsWith(prefix))?.label.slice(prefix.length);
  const flav = flavour ?? quote.flavour ?? (fromLabel("Flavour: ") ? keyOf(fromLabel("Flavour: ")) : null);
  const deliv = delivery ?? quote.delivery ?? (fromLabel("Delivery: ") ? keyOf(fromLabel("Delivery: ")) : false);
  const priced = priceQuote({
    features: quote.features, rateCard, eventDate: quote.event_date,
    now: now ?? quote.created_date ?? new Date().toISOString(), flavour: flav, delivery: deliv,
  });
  const matches = priced.total === quote.total && sum(lines) === quote.total;
  return { checked: true, matches, expected: priced.total };
}

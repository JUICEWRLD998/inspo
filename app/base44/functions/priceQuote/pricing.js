// Deterministic pricing. The model reads the photo; it never sets a number.
// Money is an integer in the smallest currency unit. Anything this module
// cannot price from the maker's rate card goes into needs_check, never a guess.

const CONFIDENCE_FLOOR = 0.6;
const DAY_MS = 86_400_000;

const money = (n) => Math.round(n);

// Amounts are in the smallest unit (2 decimals for NGN, USD, GBP, EUR). The agent must quote these strings,
// never convert units itself.
export function display(amount, currency) {
  const major = amount / 100;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major);
}

export function priceQuote({ features, rateCard, eventDate, now, delivery = false, flavour = null }) {
  const out = { currency: rateCard.currency, line_items: [], total: 0, needs_check: [], complete: true };
  const flag = (field) => {
    if (!out.needs_check.includes(field)) out.needs_check.push(field);
    out.complete = false;
  };

  if (!features || features.unreadable) {
    flag("unreadable");
    return out;
  }

  const finishMult = rateCard.finish_multipliers?.[features.finish];
  if (finishMult === undefined) flag("finish");

  (features.tiers ?? []).forEach((tier, i) => {
    if (tier.confidence < CONFIDENCE_FLOOR) flag(`tiers[${i}]`);
    const row = rateCard.tier_prices.find((t) => t.diameter_in === tier.diameter_in);
    if (!row) return flag(`tiers[${i}].diameter_in`);
    const heightMult = rateCard.height_multiplier?.[tier.height];
    if (heightMult === undefined) flag(`tiers[${i}].height`);
    const amount = money(row.price * (heightMult ?? 1) * (finishMult ?? 1));
    const tall = tier.height === "tall" ? ", tall" : "";
    out.line_items.push({ label: `${tier.diameter_in}" tier${tall}`, qty: 1, unit_price: amount, amount });
  });
  if (!out.line_items.length && !out.needs_check.includes("tiers[0].diameter_in")) flag("tiers");

  (features.decorations ?? []).forEach((d, i) => {
    if (d.confidence < CONFIDENCE_FLOOR) flag(`decorations[${i}]`);
    const row = rateCard.decoration_prices.find((p) => p.type === d.type);
    if (!row) return flag(`decorations[${i}].type`);
    if (!Number.isInteger(d.quantity) || d.quantity < 1) return flag(`decorations[${i}].quantity`);
    const qty = row.unit === "flat" ? 1 : d.quantity;
    out.line_items.push({ label: d.type.replace(/_/g, " "), qty, unit_price: row.price, amount: qty * row.price });
  });

  if (flavour) {
    const s = rateCard.flavour_surcharges?.[flavour];
    if (s === undefined) flag("flavour");
    else if (s > 0) out.line_items.push({ label: `Flavour: ${flavour.replace(/_/g, " ")}`, qty: 1, unit_price: s, amount: s });
  }

  const days = eventDate ? (Date.parse(eventDate) - Date.parse(now)) / DAY_MS : NaN;
  if (Number.isNaN(days)) flag("event_date");
  else {
    if (days < rateCard.lead_time_days) flag("event_date");
    const rush = rateCard.rush_fee;
    if (rush && days <= rush.within_days) {
      out.line_items.push({ label: "Rush fee", qty: 1, unit_price: rush.amount, amount: rush.amount });
    }
  }

  if (delivery && rateCard.delivery_fee > 0) {
    out.line_items.push({ label: "Delivery", qty: 1, unit_price: rateCard.delivery_fee, amount: rateCard.delivery_fee });
  }

  out.total = out.line_items.reduce((sum, l) => sum + l.amount, 0);
  for (const l of out.line_items) l.amount_display = display(l.amount, out.currency);
  out.total_display = display(out.total, out.currency);
  return out;
}

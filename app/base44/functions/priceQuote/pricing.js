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
  const line = (label, qty, unit_price, amount, extra = {}) =>
    out.line_items.push({ label, qty, unit_price, amount, ...extra });
  const pretty = (k) => k.replace(/_/g, " ");

  if (!features || features.unreadable) {
    flag("unreadable");
    return out;
  }

  // A rate card is additive (flat surcharges) or multiplicative (multipliers). Both are supported; additive wins
  // when the card defines it.
  const additiveFinish = rateCard.finish_surcharges;
  const finishMult = rateCard.finish_multipliers?.[features.finish];
  const finishFlat = additiveFinish?.[features.finish];
  if ((additiveFinish ? finishFlat : finishMult) === undefined) flag("finish");

  (features.tiers ?? []).forEach((tier, i) => {
    if (tier.confidence < CONFIDENCE_FLOOR) flag(`tiers[${i}]`);
    const row = rateCard.tier_prices.find((t) => t.diameter_in === tier.diameter_in);
    if (!row) return flag(`tiers[${i}].diameter_in`);
    const tall = tier.height === "tall";
    if (rateCard.height_surcharge) {
      if (rateCard.height_surcharge[tier.height] === undefined) flag(`tiers[${i}].height`);
      line(`${tier.diameter_in}" cake`, 1, row.price, row.price);
      const extra = rateCard.height_surcharge[tier.height] ?? 0;
      if (extra > 0) line("Tall cake", 1, extra, extra);
    } else {
      const heightMult = rateCard.height_multiplier?.[tier.height];
      if (heightMult === undefined) flag(`tiers[${i}].height`);
      const mult = (heightMult ?? 1) * (additiveFinish ? 1 : (finishMult ?? 1));
      const amount = money(row.price * mult);
      line(`${tier.diameter_in}" tier${tall ? ", tall" : ""}`, 1, amount, amount);
    }
  });
  if (!out.line_items.length && !out.needs_check.includes("tiers[0].diameter_in")) flag("tiers");

  if (additiveFinish && finishFlat > 0) line(`${pretty(features.finish)} covering`, 1, finishFlat, finishFlat);

  (features.decorations ?? []).forEach((d, i) => {
    if (d.confidence < CONFIDENCE_FLOOR) flag(`decorations[${i}]`);
    const row = rateCard.decoration_prices.find((p) => p.type === d.type);
    if (!row) return flag(`decorations[${i}].type`);
    if (!Number.isInteger(d.quantity) || d.quantity < 1) return flag(`decorations[${i}].quantity`);
    const qty = row.unit === "flat" ? 1 : d.quantity;
    const extra = {};
    if (row.price_max) {
      flag(`decorations[${i}].price`);
      extra.note = `Range ${display(row.price, out.currency)} to ${display(row.price_max, out.currency)}; low end shown, she confirms.`;
    }
    line(pretty(d.type), qty, row.price, qty * row.price, extra);
  });

  if (flavour) {
    const surcharge = rateCard.flavour_surcharges?.[flavour];
    if (surcharge === undefined) flag("flavour");
    else if (surcharge > 0) line(`Flavour: ${pretty(flavour)}`, 1, surcharge, surcharge);
  }

  const cakeSubtotal = out.line_items.reduce((sum, l) => sum + l.amount, 0);
  const days = eventDate ? (Date.parse(eventDate) - Date.parse(now)) / DAY_MS : NaN;
  if (Number.isNaN(days)) flag("event_date");
  else {
    if (days < rateCard.lead_time_days) flag("event_date");
    const tier = [...(rateCard.rush_tiers ?? [])].sort((a, b) => a.within_days - b.within_days).find((t) => days <= t.within_days);
    if (tier) {
      const amount = money((cakeSubtotal * tier.percent) / 100);
      line(`Rush order (${tier.percent}%)`, 1, amount, amount);
      flag("rush_availability");
    }
    const rush = rateCard.rush_fee;
    if (rush && days <= rush.within_days) line("Rush fee", 1, rush.amount, rush.amount);
  }

  if (delivery) {
    if (rateCard.delivery_zones) {
      const fee = typeof delivery === "string" ? rateCard.delivery_zones[delivery] : undefined;
      if (fee === undefined) flag("delivery_zone");
      else line(`Delivery: ${delivery}`, 1, fee, fee);
    } else if (rateCard.delivery_fee > 0) {
      line("Delivery", 1, rateCard.delivery_fee, rateCard.delivery_fee);
    }
  }

  out.total = out.line_items.reduce((sum, l) => sum + l.amount, 0);
  for (const l of out.line_items) l.amount_display = display(l.amount, out.currency);
  out.total_display = display(out.total, out.currency);
  if (rateCard.deposit_percent) {
    out.deposit_due = money((out.total * rateCard.deposit_percent) / 100);
    out.deposit_display = display(out.deposit_due, out.currency);
  }
  return out;
}

// Rate card <-> editable form. The baker types naira; the card stores kobo. Anything invalid comes back as a
// plain message, never a silently fixed number.
import { toMajorString, toMinor } from "./money.js";

// Keep in step with base44/functions/extractFeatures/schema.js: a type the photo reader never returns can't be priced.
export const DECORATION_TYPES = ["sugar_flowers", "fresh_flowers", "gold_drip", "drip", "topper", "figurine", "edible_print", "piping", "macarons", "other"];
export const FINISHES = ["buttercream", "fondant", "semi_naked", "ganache", "other"];

const entries = (o) => Object.entries(o ?? {}).map(([key, v]) => ({ key, price: toMajorString(v) || "0" }));

export function toForm(card) {
  const rush = card.rush_tiers?.[0];
  return {
    tiers: (card.tier_prices ?? []).map((t) => ({ diameter: String(t.diameter_in), price: toMajorString(t.price) })),
    finishes: entries(card.finish_surcharges),
    tall: toMajorString(card.height_surcharge?.tall) || "0",
    flavours: entries(card.flavour_surcharges),
    decorations: (card.decoration_prices ?? []).map((d) => ({
      type: d.type, unit: d.unit, price: toMajorString(d.price), max: d.price_max ? toMajorString(d.price_max) : "",
    })),
    rushPercent: rush ? String(rush.percent) : "",
    rushWithinDays: rush ? String(rush.within_days) : "1",
    zones: entries(card.delivery_zones),
    depositPercent: card.deposit_percent != null ? String(card.deposit_percent) : "",
    leadDays: card.lead_time_days != null ? String(card.lead_time_days) : "",
  };
}

const keyOf = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

export function fromForm(form) {
  const errors = [];
  const price = (s, where, opts) => {
    const v = toMinor(String(s), opts);
    if (v === null) errors.push(`${where}: enter a price like 42000 or 42,000.50`);
    return v;
  };
  const keyed = (rows, label, allowed) => {
    const out = {};
    for (const r of rows) {
      const k = keyOf(r.key);
      if (!k) { errors.push(`${label}: every row needs a name`); continue; }
      if (allowed && !allowed.includes(k)) errors.push(`${label}: "${r.key}" is not a finish the photo reader knows`);
      if (k in out) errors.push(`${label}: "${k}" appears twice`);
      out[k] = price(r.price, `${label} "${r.key || "?"}" price`, { allowZero: true });
    }
    return out;
  };

  const seen = new Set();
  const tier_prices = form.tiers.map((t) => {
    const d = Number(t.diameter);
    if (!(d > 0)) errors.push(`Cake size "${t.diameter}": enter the diameter in inches`);
    if (seen.has(d)) errors.push(`Cake size ${d}": listed twice`);
    seen.add(d);
    return { diameter_in: d, price: price(t.price, `Cake size ${t.diameter}" price`) };
  });
  if (tier_prices.length === 0) errors.push("Add at least one cake size");

  const decoration_prices = form.decorations.map((d) => {
    if (!DECORATION_TYPES.includes(d.type)) errors.push(`Decoration type "${d.type}" is not one the photo reader returns`);
    const row = { type: d.type, unit: d.unit === "flat" ? "flat" : "each", price: price(d.price, `${d.type} price`) };
    if (String(d.max).trim()) {
      const max = price(d.max, `${d.type} top price`);
      if (max !== null && row.price !== null && max <= row.price) errors.push(`${d.type}: the top of the range must be above the low end`);
      row.price_max = max;
    }
    return row;
  });

  const pct = (s, where) => {
    const n = Number(s);
    if (!Number.isInteger(n) || n < 0 || n > 100) { errors.push(`${where}: enter a whole number from 0 to 100`); return null; }
    return n;
  };
  const deposit_percent = form.depositPercent === "" ? null : pct(form.depositPercent, "Deposit");
  const lead = Number(form.leadDays);
  if (!Number.isInteger(lead) || lead < 0) errors.push("Minimum notice: enter whole days");

  const out = {
    tier_prices,
    finish_surcharges: keyed(form.finishes, "Finish", FINISHES),
    height_surcharge: { standard: 0, tall: price(form.tall, "Tall cake extra", { allowZero: true }) },
    flavour_surcharges: keyed(form.flavours, "Flavour"),
    decoration_prices,
    delivery_zones: keyed(form.zones, "Delivery area"),
    lead_time_days: lead,
  };
  if (form.rushPercent !== "") {
    const percent = pct(form.rushPercent, "Rush surcharge");
    const within = Number(form.rushWithinDays);
    if (!(within >= 0)) errors.push("Rush window: enter the number of days");
    out.rush_tiers = [{ within_days: within, percent }];
  } else {
    out.rush_tiers = [];
  }
  if (deposit_percent !== null) out.deposit_percent = deposit_percent;

  return errors.length ? { card: null, errors } : { card: out, errors: [] };
}

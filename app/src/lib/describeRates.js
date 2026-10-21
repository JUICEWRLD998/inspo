// Turns a RateCard into the plain-language lists the public price section shows. Every figure comes from the card.
import { display } from "../../base44/functions/priceQuote/pricing.js";

const words = (key) => {
  const s = key.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const DECORATION_NAMES = { topper: "Custom topper", edible_print: "Photo print on the cake", drip: "Chocolate drip" };

export function describeRateCard(card, { baker = "the baker" } = {}) {
  const cur = card.currency ?? "NGN";
  const m = (n) => display(n, cur);
  const plus = (n) => `+${m(n)}`;

  const decorations = (card.decoration_prices ?? []).map((d) => ({
    name: DECORATION_NAMES[d.type] ?? words(d.type),
    price: d.price_max ? `${m(d.price)} to ${m(d.price_max)}` : d.unit === "each" ? m(d.price) : plus(d.price),
    per: d.unit === "each" ? "each" : null,
  }));
  const rush = card.rush_tiers?.[0];

  return {
    sizes: [...(card.tier_prices ?? [])].sort((a, b) => a.diameter_in - b.diameter_in).map((t) => ({ inches: t.diameter_in, price: m(t.price) })),
    finishes: Object.entries(card.finish_surcharges ?? {}).filter(([, v]) => v > 0).map(([k, v]) => ({ name: words(k), price: plus(v) })),
    tall: card.height_surcharge?.tall > 0 ? plus(card.height_surcharge.tall) : null,
    flavours: Object.entries(card.flavour_surcharges ?? {}).map(([k, v]) => ({ name: words(k), price: v > 0 ? plus(v) : "Included" })),
    decorations,
    rush: rush ? `+${rush.percent}% when the event is within ${rush.within_days} day${rush.within_days === 1 ? "" : "s"}. ${baker} checks there is room first.` : null,
    delivery: Object.entries(card.delivery_zones ?? {}).map(([k, v]) => ({ area: words(k), price: `from ${m(v)}` })),
    depositPercent: card.deposit_percent ?? null,
    noticeDays: card.lead_time_days ?? null,
  };
}

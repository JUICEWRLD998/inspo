// Plain-language text for the flags priceQuote raises (needs_check). An unknown flag is shown as-is, never hidden.
const n = (i) => Number(i) + 1;

const RULES = [
  [/^tiers\[(\d+)\]\.diameter_in$/, (i) => `Tier ${n(i)}: this size is not on your price list`],
  [/^tiers\[(\d+)\]\.height$/, (i) => `Tier ${n(i)}: check whether it is tall`],
  [/^tiers\[(\d+)\]$/, (i) => `Tier ${n(i)}: the photo was hard to read, check the size`],
  [/^decorations\[(\d+)\]\.type$/, (i) => `Decoration ${n(i)}: not on your price list, price it yourself`],
  [/^decorations\[(\d+)\]\.price$/, (i) => `Decoration ${n(i)}: your price is a range, pick the amount`],
  [/^decorations\[(\d+)\]\.quantity$/, (i) => `Decoration ${n(i)}: check how many`],
  [/^decorations\[(\d+)\]$/, (i) => `Decoration ${n(i)}: the photo was hard to read, check it`],
];

const FIXED = {
  event_date: "Event date: missing or inside your minimum notice",
  rush_availability: "Rush order: confirm you can fit it in",
  delivery_zone: "Delivery: the area is not on your price list",
  flavour: "Flavour: not on your price list",
  finish: "Finish: not on your price list",
  tiers: "No cake size was found in the photo",
  unreadable: "The photo could not be read as a cake",
};

export function explainCheck(field) {
  if (FIXED[field]) return FIXED[field];
  for (const [re, text] of RULES) {
    const m = re.exec(field);
    if (m) return text(m[1]);
  }
  return `Check: ${field}`;
}

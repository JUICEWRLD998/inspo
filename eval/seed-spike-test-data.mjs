// SPIKE-ONLY test records so the agent has something to price against. Not a real maker.
// Delete before the real run: see DECISIONS.md. Run from app/: npx base44@latest exec < ../eval/seed-spike-test-data.mjs
const maker = await base44.entities.Maker.create({
  name: "SPIKE TEST (not a real maker)",
  brand: "Spike Test Bakery",
  city: "n/a",
  currency: "NGN",
  lead_time_days: 5,
  deposit_percent: 50,
});
const card = await base44.entities.RateCard.create({
  maker_id: maker.id,
  currency: "NGN",
  tier_prices: [
    { diameter_in: 6, price: 2000000 },
    { diameter_in: 8, price: 3000000 },
    { diameter_in: 10, price: 4500000 },
    { diameter_in: 12, price: 6000000 },
  ],
  height_multiplier: { standard: 1, tall: 1.5 },
  finish_multipliers: { buttercream: 1, fondant: 1.3, semi_naked: 1.1 },
  flavour_surcharges: { red_velvet: 200000 },
  decoration_prices: [
    { type: "sugar_flowers", unit: "each", price: 150000 },
    { type: "topper", unit: "each", price: 300000 },
    { type: "gold_drip", unit: "flat", price: 500000 },
  ],
  rush_fee: { within_days: 3, amount: 1000000 },
  delivery_fee: 400000,
  lead_time_days: 5,
});
console.log(JSON.stringify({ maker_id: maker.id, rate_card_id: card.id }));

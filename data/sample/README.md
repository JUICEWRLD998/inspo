# SAMPLE DATA. NOT A REAL BAKERY.

Everything in this folder came from a ChatGPT conversation titled "Create Demo Cake Data"
(https://chatgpt.com/share/6ad7a43d-ec34-83ea-a7a9-12e77717ce8f, read 2026-10-20). That conversation invented
"Aminat's Cake Studio" and "Aminat Bello", and says in its own words that the amounts are "invented for testing"
and the orders are "fictional ... not real customer records or actual historical transactions".

Use it to exercise the pricing engine and build the console. Do not present it as a real maker, real customers,
real sales or real adoption. Wherever it is shown, it is labelled sample data.

- `rate-card.json`: the price list from that conversation, in smallest currency units (kobo).
- `orders.json`: its 15 "previous orders". The `features` were transcribed by hand from each order's text; no
  photo exists, so they test **pricing only**, not photo reading.
- Replace both with the real maker's files when she exists. `eval/run.mjs` takes the folder as an argument.

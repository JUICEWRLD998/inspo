# Eval

`node eval/run.mjs [dataDir]` runs each past order through `priceQuote` and compares the quote with the price
that was charged. It writes `eval/results.sample.json` (sample data) or `eval/results.json` (real data).

## Current result: SAMPLE DATA, not a real bakery

Data: `data/sample` (invented in a ChatGPT conversation; see `data/sample/README.md`).

| | |
|---|---|
| Orders | 15 |
| Exact matches | 11 |
| Median absolute error | 0% |
| Worst | 10% (order 3, quoted ₦55,000 vs ₦50,000 "charged") |
| Orders needing a check | 2 (a price range; a rush order) |

## What this number does and does not mean

- **It is a consistency check, not accuracy.** The sample price list and the sample "past prices" were written by
  the same author in the same sitting, and most prices are the list arithmetic. A median of 0% shows the engine
  implements the stated card. It says nothing about how a real baker really prices.
- **It is pricing only.** The `features` were transcribed from each order's text. No photo exists, so photo reading
  (`extractFeatures`) is not measured here.
- The four misses are the sample's own "rounded or adjusted prices" (orders 2, 3, 5, 9). The engine quotes the list
  and does not tune itself to them.
- Do not quote the 0% as accuracy in the README, video or post. The honest line is: "the engine reproduces a
  stated price list exactly; accuracy against a real baker's past orders is not yet measured."

When a real maker supplies a rate card and past orders, run `node eval/run.mjs data/<maker>` and report that number.

# Inspo

**Mustapha Fadhlullah — independent security researcher** · Base44 Challenge entry

Send the inspo. Get the price. A customer sends a photo of the cake they want to a bakery's WhatsApp number. A
vision model reads the photo into a fixed list of features. A deterministic function prices those features from the
maker's own rate card. She approves with one tap, and the order lands on her bake calendar with reminders.

**The model never sets a number.** It reads; `priceQuote` prices; she approves.

## Status (LIVE / NEXT / NOT LIVE)

| Part | Status |
|---|---|
| Pricing core `priceQuote` (tests, deployed function) | LIVE, tested with a test-only rate card |
| `extractFeatures` (photo to features, deployed function) | LIVE, plumbing verified on a non-cake control; runs on real cake photos return schema-valid features; accuracy NOT MEASURED |
| Entities: Maker, RateCard, Customer, Quote, Order | LIVE |
| WhatsApp desk (app agent) | LIVE for one test conversation: photo to pending quote works; customer record NOT created |
| Maker console, automations | NEXT |
| Public site in the maker's brand | NOT LIVE (placeholder page only) |
| Pricing eval | LIVE on SAMPLE data only (11/15 exact; circular, not accuracy). Real-orders eval NEXT |

**No real maker exists yet.** The rate card and the 15 past orders in `data/sample` are SAMPLE DATA invented in a ChatGPT conversation (see `data/sample/README.md`); they are labelled sample everywhere they appear and are not a real bakery, real customers or real sales.

## Verify in 60 seconds

```bash
cd app && npm install && npm test
node eval/run.mjs                        # 15 sample orders through the pricing engine (see eval/README.md)        # 24 tests: pricing arithmetic, the sample rate card and the extraction normaliser
```

Pricing contract, from `app/tests/pricing.test.js`: every amount is a positive integer; the line items sum to the
total; a tier size or decoration she does not price goes to `needs_check` instead of being guessed; the same input
gives the same output.

## Layout

- `app/base44/entities/` data model, pushed with `base44 entities push -y`
- `app/base44/functions/priceQuote/` deterministic pricing (`pricing.js`) and its function wrapper
- `app/base44/functions/extractFeatures/` fixed-schema photo reader, output normalised server-side
- `app/src/` React frontend (CSS Modules + design tokens + `motion`; no Tailwind)
- `eval/` spike and evaluation scripts
- `implementation.md` build order · `DECISIONS.md` measured decisions · `CLAIMS.md` claim to command

## Running the Base44 CLI from a cloud container

Node's fetch ignores the container proxy, so set `NODE_USE_ENV_PROXY=1` and `NODE_EXTRA_CA_CERTS`. Details and the
other traps are in `DECISIONS.md`.

## What this is NOT

Not a marketplace, not multi-maker onboarding, not inventory or delivery tracking. One maker, one rate card.

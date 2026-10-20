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
| WhatsApp desk (app agent) | NEXT (Spike B) |
| Maker console, automations | NEXT |
| Public site in the maker's brand | NOT LIVE (placeholder page only) |
| Eval on real past orders | NEXT, blocked on the maker's data |

No real maker, customer or quote exists in this repo yet. Nothing here is mocked to look like one.

## Verify in 60 seconds

```bash
cd app && npm install && npm test        # 13 tests: pricing arithmetic and extraction normaliser
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

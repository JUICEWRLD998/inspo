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
| WhatsApp desk (app agent) | LIVE for test conversations from the owner's phone: photo to priced pending quote, photo re-hosted, customer record linked (checked 2026-10-21). Customers message Base44's shared WhatsApp number through the site button. Linking by "most recent conversation" is NOT verified with two customers at once |
| Intake guards on `saveQuote` and `extractFeatures` (both answer unauthenticated calls) | LIVE: photo link must be `https://media.base44.com`, inputs validated, 30 quotes per hour cap, no model override |
| Maker console (`/desk`, `/orders`, `/rates`, `/settings`) | LIVE, owner sign-in only. Verified in a browser against the local backend; not yet exercised signed in on the live URL |
| Reminders and alerts | LIVE as a Today screen (one tap each) and an opt-in new-quote email. NOT scheduled: Workflows needs a paid Base44 plan |
| Public site (`/`): hero with photo and quote, how it works, live price list, FAQ, WhatsApp CTA | LIVE, on SAMPLE data, labelled as such. No gallery: there is no real maker |
| Real run (P7) | NOT LIVE. Tooling is ready (test-quote exclusion, `eval/live.mjs`, Maker-driven site, `docs/GO-LIVE.md`) but there is no real maker, so `eval/live.json` holds honest zeros (0 real quotes, 2 test quotes excluded, studio still sample) and no adoption number is claimed |
| Pricing eval | LIVE on SAMPLE data only (11/15 exact; circular, not accuracy). Real-orders eval NEXT |
| Console signed in on the live URL | NOT LIVE (unverified): needs the owner's own browser |

**No real maker exists yet.** The rate card and the 15 past orders in `data/sample` are SAMPLE DATA invented in a ChatGPT conversation (see `data/sample/README.md`); they are labelled sample everywhere they appear and are not a real bakery, real customers or real sales.

## Verify in 60 seconds

```bash
cd app && npm install && npm test
node eval/run.mjs                        # 15 sample orders through the pricing engine (see eval/README.md)
node eval/contrast.mjs                   # WCAG ratios for every colour pair, both schemes
node eval/anon-access.mjs <url> <appId>  # an anonymous visitor must not read quotes, customers or orders
node eval/hue-distance.mjs              # role hues at least dE 20 apart; accent 4x the chroma of any surface
node eval/browser/qa.mjs | journey.mjs | states.mjs | widths.mjs   # the landing page, with planted controls        # 114 tests: pricing, the sample rate card, extraction, quote editing and approval, money, rates form, calendar, reminders
```

Pricing contract, from `app/tests/pricing.test.js`: every amount is a positive integer; the line items sum to the
total; a tier size or decoration she does not price goes to `needs_check` instead of being guessed; the same input
gives the same output.

## Layout

- `app/base44/entities/` data model, pushed with `base44 entities push -y`
- `app/base44/functions/priceQuote/` deterministic pricing (`pricing.js`) and its function wrapper
- `app/base44/functions/extractFeatures/` fixed-schema photo reader, output normalised server-side
- `app/src/site/` the public landing page (the quote card is `QuoteCard.jsx`; its numbers are a captured real run in `demo-quote.json`)
- `app/src/` the maker console: React, CSS Modules + design tokens + `motion`; no Tailwind
- `app/base44/functions/saveQuote/` the agent's only write path: prices on the server, saves the quote, links the sender
- `eval/` spike and evaluation scripts
- `implementation.md` build order · `DECISIONS.md` measured decisions · `CLAIMS.md` claim to command

## Running the Base44 CLI from a cloud container

Node's fetch ignores the container proxy, so set `NODE_USE_ENV_PROXY=1` and `NODE_EXTRA_CA_CERTS`. Details and the
other traps are in `DECISIONS.md`.

## What this is NOT

Not a marketplace, not multi-maker onboarding, not inventory or delivery tracking. One maker, one rate card.

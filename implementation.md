# Inspo: implementation plan

**Mustapha Fadhlullah — independent security researcher** · Base44 Challenge on Contra · plan written 2026-10-20

Customers send a picture of the cake they want. The bakery's WhatsApp replies with a real price in about 20
seconds. The maker approves with one tap, and the order lands on her bake calendar with reminders sent
automatically.

> Tagline: No more "DM for price". Send the inspo. Get the price.

Read `CLAUDE.md` first (house rules, design rules, verification rules). This file is the build order. Write each
phase's result into `DECISIONS.md` as you go. Mark every claim about Base44 VERIFIED (doc URL or live response) or
UNVERIFIED.

---

## 0. Facts that fix the build

| Fact | Value | Source |
|---|---|---|
| Deadline | Enter by **Oct 25, 11:59pm PDT** = **2026-10-26 06:59 UTC** | contra.com/community/topic/base44challenge/guidelines |
| Must ship | (1) a live, published Base44 app, fully designed and mobile-responsive; (2) a short video walkthrough of the build and the process; (3) a public X or LinkedIn post tagged **#Base44Challenge** and **@Base44** | same page |
| Judged on | "Design quality – Branding, UX, and mobile responsiveness." · "Automation depth – Does the automation meaningfully save time, improve operations, increase leads, or enhance the customer experience?" · "The story – How well does your walkthrough showcase your process and purpose behind the build?" (the page says four dimensions and lists three) | same page |
| WhatsApp agents | "Each agent is assigned its own WhatsApp number." "WhatsApp conversations support images and voice messages." Agents can do "creating, reading, updating, or deleting entities in your app". "available for free on all plans", up to 3 agents. "WhatsApp agents use integration credits only." 1 credit per message relay plus LLM and email costs | docs.base44.com/Building-your-app/AI-agents-for-apps |
| Backend functions | Deno. `base44/functions/<name>/entry.ts`, a default-exported `async function (req: Request): Promise<Response>`, `createClientFromRequest(req)` from `npm:@base44/sdk`, `asServiceRole` for calls with no user, `secrets.get()` from `base44:runtime`, 5 min max, chains of 7 at most. Frontend calls `base44.functions.invoke(name, payload)` | docs .../backend-functions/overview |
| Automations | `function.jsonc` `automations`: `scheduled` (cron or simple), `entity` (`entity_name`, `event_types`), `connector` | docs .../backend-functions/automations |
| CLI | `npx base44@latest` (Node ≥ 20.19.0): `create`, `link`, `dev`, `deploy` (entities, functions, connectors, auth config, site files in one go), `functions deploy`, `actors deploy`, `secrets set`, `site open`, `logs` | docs .../cli/get-started/overview |
| Built-in integrations | SendEmail (~1 credit), SendPushNotification, GenerateImage, GenerateSpeech, TranscribeAudio, UploadFile, ExtractDataFromUploadedFile, InvokeLLM (cost depends on model) | docs.base44.com/Integrations/built-in-integrations |
| Free plan | 25 message credits and 100 integration credits a month; the challenge gives a coupon (Settings → Credit Usage → "Redeem a coupon or gift card"). Starter is $16/mo, billed yearly | base44.com/pricing |

UNVERIFIED and checked in P0: the exact InvokeLLM parameters for an image (`file_urls`?) and a JSON schema; how an
app agent hands an image to a backend function; whether a backend function or automation can send a WhatsApp
message first (outside a reply); whether a CLI deploy costs message credits; what `create` scaffolds for the
frontend; where agent config lives for `actors deploy`.

## 1. Inputs he provides (blocking)

1. **The maker.** A real, named, made-to-order business that has said yes in writing (cake maker first; the
   mechanism also fits a tailor, nail tech or florist). Record her name, brand, city, the consent message and the
   date in `DECISIONS.md`. Deadline 2026-10-22 12:00 local. If the only yes is a café, stop and tell him: the
   fallback product is different (it lives in his private strategy notes).
2. **Her rate card:** prices by tier size, finish, flavour, decorations, rush fee, delivery. Her real numbers, in
   her currency.
3. **15-20 past orders:** a photo of each finished cake (or the customer's inspo) plus the price she charged.
   This is the eval set.
4. **Her brand assets:** logo (if any), 20+ real photos, colours, the way she talks to customers.
5. **His Base44 login** (the CLI login runs in his browser) and **his phone** for the WhatsApp tests.
6. **A video:** her on camera for 10 seconds, saying what quoting on WhatsApp costs her. With her consent.

## 2. Architecture

```
Customer (WhatsApp) --photo--> Base44 app agent "Inspo desk" (own WhatsApp number)
                                   | tool: create Quote(draft) + call function
                                   v
                     fn extractFeatures(image) --InvokeLLM vision, fixed JSON schema, NO prices-->
                                   v
                     fn priceQuote(features, RateCard) --deterministic--> line items + total
                                   v
                     Quote(status: pending_approval) --entity automation--> maker alert
Maker console (mobile web) --approve--> Order(created) --automations--> confirmation, deposit
                                                                       reminder, pickup reminder
Public site (her brand) <-- live proof strip (counts from Quote/Order) -- "Send us your inspo" CTA
```

The model reads the picture. **It never sets a number.** Every price comes from `priceQuote` and her rate card,
and she approves every quote by default (an auto-send threshold is a stretch goal).

### Entities (Base44 data model; field names final in P1)

| Entity | Fields |
|---|---|
| `Maker` | name, brand, city, currency, whatsapp_display, lead_time_days, auto_approve_below (number or null), deposit_percent, bank_or_payment_note |
| `RateCard` | maker_id, tier_prices (array: {diameter_in, price}), height_multiplier (standard 1.0, tall), finish_multipliers ({buttercream, fondant, semi_naked, ...}), flavour_surcharges, decoration_prices (array: {type, unit, price}), rush_fee ({within_days, amount}), delivery_fee, updated_at |
| `Customer` | name, whatsapp_id (as the channel gives it), first_seen_at, orders_count |
| `Quote` | customer_id, image_url, features (JSON from extractFeatures), line_items (array: {label, qty, unit_price, amount}), total, currency, needs_check (array of field names the model was unsure of), status (draft, pending_approval, sent, accepted, expired, declined), event_date, servings, created_at, answered_at, approved_at |
| `Order` | quote_id, customer_id, total, deposit_due, deposit_status (unpaid, paid_confirmed_by_maker), pickup_or_delivery_at, status (confirmed, baking, ready, collected, cancelled), notes |

Dates are ISO 8601 with timezone. Money is an integer in the smallest currency unit.

### Feature schema (the only thing the model returns)

```json
{
  "tiers": [{ "diameter_in": 8, "height": "standard|tall", "confidence": 0.0 }],
  "shape": "round|square|heart|sheet|number|other",
  "finish": "buttercream|fondant|semi_naked|ganache|other",
  "decorations": [{ "type": "sugar_flowers|fresh_flowers|gold_drip|drip|topper|figurine|edible_print|macarons|other",
                    "quantity": 1, "size": "small|medium|large", "confidence": 0.0 }],
  "text_on_cake": "string or null",
  "colours": ["string"],
  "servings_estimate": 0,
  "unreadable": false,
  "notes": "string"
}
```

Any field with confidence < 0.6 goes into `Quote.needs_check`. The maker sees it highlighted before she approves.
A photo that is not a cake sets `unreadable: true`, and the agent asks for a clearer picture.

## 3. Phases

Each phase ends with an **exit check** that is run, not reasoned about. When it passes, commit with a real message.
Skills are in `.claude/skills/`.

### P0: Environment and spikes (do first; nothing else starts until it passes)
- Cloud environment: allow network access to `base44.com`, `app.base44.com`, `docs.base44.com`, the npm
  registry and `api.paystack.co` (custom allowlist or full access). Check with `curl -sI https://app.base44.com`.
- `npx base44@latest --version`. Log in (`npx base44@latest login` or the documented auth command). If the login
  needs a browser the cloud session cannot open, print the URL and code and ask him.
- `npx base44@latest create` into `app/`. Write down what it scaffolds (framework, Tailwind or not, folders). If
  Tailwind is preinstalled, remove it; the house stack is CSS Modules + design tokens + `motion` (`motion/react`).
- Read, then record in `DECISIONS.md` with URLs: the agents docs for developers
  (docs.base44.com/developers/backend/resources/agents/overview), the SDK InvokeLLM signature, and the CLI
  `actors deploy` config format.
- **Spike A (image to features):** a backend function `extractFeatures` that takes an image URL and returns the
  JSON above via InvokeLLM. Run it on 3 cake photos. Record the output and the credits it used.
- **Spike B (WhatsApp end to end):** create the app agent, connect WhatsApp, send a photo from his phone, and
  confirm the agent can (1) pass the image to `extractFeatures`, (2) create a `Quote` record, and (3) reply. Record
  the transcript and the credits used.
- **Spike C (outbound):** can a backend function or automation send a WhatsApp message to a customer who wrote in
  earlier? If not, confirmations and reminders go by email or SMS, or the maker sends them with one tap from the
  console. Decide and record.
- Exit: `DECISIONS.md` holds the three spike results with the transcripts and the credit cost per quote. If Spike B
  fails, switch the intake to photo upload on the site with a WhatsApp handoff link, and say so.
- Skills: `systematic-debugging` when a spike misbehaves.

### P1: Day-one files and the pricing core (test first)
- `README.md` (thesis, how it works, live links, verify in 60 seconds, what this is NOT; about 200 lines; written
  before the UI), `CLAIMS.md` (each README claim mapped to the command that reproduces it), `DECISIONS.md` (newest
  first: measurement, rejected alternative, file or commit).
- Entities in `base44/entities/` and pushed with `entities push`.
- `priceQuote` as a pure module in `base44/shared/pricing.ts`, imported by the function. Inputs: features and a
  RateCard. Output: line items and total. Rules: tier price × height multiplier × finish multiplier, plus each
  decoration line, plus a rush fee when the event date is within the lead time, plus delivery when asked.
- Tests first (`test-driven-development`): fixtures built from her real rate card. Every amount is a positive
  integer, the line items sum to the total, a missing tier size raises `needs_check` instead of guessing, and the
  same input always gives the same output.
- Exit: `npm test` green; `CLAIMS.md` lists the test command.

### P2: Extraction and the eval (the M4 proof)
- `extractFeatures` hardened: a fixed schema, confidence per field, the `unreadable` path, and a model chosen for
  cost against accuracy (record both).
- Eval: run the 15-20 past orders through extract + price. Compare with the price she actually charged. Write
  `eval/results.json` and `eval/README.md`: per-order error, median absolute % error, and how many needed a check.
  Report the number honestly, whatever it is. That number goes in the video and the README.
- Exit: `node eval/run.mjs` reproduces the table.

### P3: The WhatsApp desk (the agent)
- Agent instructions in her voice (English, and tolerant of Pidgin if she uses it). The flow: greet; take the
  photo; ask for event date and servings only if missing; call extract + price; reply with the breakdown and
  "pending <maker name>'s confirmation"; once approved, send the final price and deposit instructions.
- Edge paths: not a cake, several photos, a voice note (TranscribeAudio, stretch), a price question with no photo,
  a request to speak to a human (it flags the maker).
- Exit: 10 scripted WhatsApp conversations from his phone, transcripts saved in `eval/agent/`, every reply's
  total equal to `priceQuote` for the same features.

### P4: The maker console (mobile web, behind login)
- Routes: `/desk` approvals queue (photo, features with `needs_check` highlighted, line items she can edit, the
  approve button); `/orders` bake calendar; `/rates` rate-card editor; `/settings`.
- Approve flips Quote to `sent` and creates the Order. Editing a line before approval is logged on the Quote.
- Exit: browser-driven run on a phone viewport: approve a pending quote and see the Order on the calendar.

### P5: Automations
- `entity` on Quote created with `pending_approval`: alert the maker (push or email).
- `entity` on Order created: confirmation to the customer (channel from Spike C).
- `scheduled` daily: deposit reminder for unpaid orders within lead time; pickup reminder the day before.
- Stretch: a follow-up 24 h after a quote that got no answer ("sending a quote and never hearing back" is the
  maker's known loss).
- Exit: `npx base44@latest logs` shows each automation firing once on test records; screenshots of the messages.

### P6: The public site (her brand) and the signature moment
- Run `ui-studio` with its kickoff. Ground the brand in her world: her cakes, her colours and her words. This is a
  client brand, so do NOT apply his SIGNAL DECK palette; measure an OKLCH palette from her real photos and logo.
- Sections: hero with her best real cake photo; "Send us your inspo" (opens WhatsApp with a prefilled message);
  how it works in three steps; gallery of real cakes; live proof strip (quotes answered, median reply time, orders
  this week, computed from records and never hardcoded); FAQ; contact.
- Signature moment (one, choreographed with `motion`): a quote card assembling line by line next to an inspo
  photo, using real numbers from a real quote. The video and the thumbnail are cut from it.
- Every width: screenshots at 320, 375, 414, 768, 1024, 1280, 1440 and 1920 px, each band composed.
- Exit: the ui-studio QUALITY BAR passes in a real browser (`ui-studio/scripts/ui-score.mjs` with its planted
  controls), and the contrast pairs are written out.

### P7: The real run (Oct 22-25)
- The maker shares the number with real customers (her status, her Instagram, her regulars).
- Log every real quote; never generate activity. Count quotes, median reply time, approvals, orders and edits she
  made before approving (the edit rate is the honest accuracy number).
- Exit: `eval/live.json` with dated real counts, and the proof strip on the site reads the same numbers.

### P8: Verification and hardening
- `product-hardening` demo-seam audit; `ecc:browser-qa` or Playwright on the deployed URL from a clean browser.
- The judge's path: open the site on a phone width, tap "Send us your inspo", send any cake photo, get a priced
  reply. Run it on the live deployment.
- Pre-submit grep: `mock|fake|dummy|lorem|0x0000|picsum|randomuser|example.com`. Justify or fix every hit.
- One status vocabulary everywhere: LIVE / NEXT / NOT LIVE.
- Exit: a checklist in `DECISIONS.md` with each item run and its result.

### P9: Packaging (he presses submit)
- Video (about 90 seconds, cap permitting): run `demo-video` from the deployed link. Outline: her nightly DMs and
  her consent (0-10 s); the wow, a photo in and a priced quote out (10-30 s); her rate card, the approve tap, the
  calendar, the reminders (30-50 s); the site (50-70 s); the week's real numbers (70-85 s); how it was built with
  Base44: the agent, entities, automations, CLI (85-90 s).
- Post copy for X and LinkedIn: 1-2 sentences, a 30-second cut, #Base44Challenge and @Base44, run through
  `humanizer`. Draft only; he posts.
- Contra submission: the live link, the video, the post links. Draft the fields; he submits.
- Exit: every artifact link opens from a logged-out browser.

## 4. Milestones (no calendar)
1. Thin path: one photo in, one priced reply out (P0-P3 minimum).
2. Feature-complete: console, automations, site (P4-P6).
3. Demo freeze: real run numbers in, no new features (P7-P8).
4. Packaging and submission (P9). Packaging is its own milestone and is never cut.

## 5. Scope
- **MVP:** rate-card editor; WhatsApp photo to priced quote; approve; calendar; two reminders; branded
  mobile-first site with gallery and live proof strip; the eval table.
- **Stretch:** deposit link (Paystack through a backend function for a Nigerian maker, with the secret in Base44
  secrets and never in the repo; Base44 Payments or Stripe elsewhere); follow-up on silent quotes; voice-note orders;
  auto-approve under a threshold.
- **NOT BUILDING:** a marketplace, onboarding for many makers, inventory, delivery tracking.

## 6. Rubric map (fill in as features ship)
| Criterion | Feature that answers it | Evidence |
|---|---|---|
| Design quality | her brand from her own photos; the signature quote-card moment; mobile-first at every width | screenshots per width, ui-score output |
| Automation depth | photo → features → price → approval → order → reminders, with no hands until approval | automation logs, `eval/live.json` (time saved per quote, reply time) |
| The story | her consent and her nightly DMs, before and after, real numbers from the week, built on Base44 | the video, README |

## 7. Risks and fallbacks
1. **No maker by 2026-10-22 12:00.** Tell him at once; do not build a fictional bakery.
2. **Spike B fails.** Photo upload on the site, with replies by WhatsApp link.
3. **Vision misreads.** The model only extracts; she approves; `needs_check` shows doubt; the eval reports the error.
4. **Credits.** Measure the cost per quote in P0. Redeem the coupon. Upgrading is his decision.
5. **Design against professional designers.** The full ui-studio pass, her real photos, one signature moment.

## 8. Never
- A fake bakery, a fake customer, a hardcoded proof number, or an LLM-set price.
- Secrets in the repo. Strategy notes in the repo.
- Posting, emailing the maker's customers in bulk, or submitting without his go.

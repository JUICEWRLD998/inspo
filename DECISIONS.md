# DECISIONS

Newest first. Each entry: what was measured, what was rejected, where the evidence is. Tags: VERIFIED (doc URL, file
or live response) or UNVERIFIED. Corrections are made in place and marked CORRECTION.

## 2026-10-20 · P6 the public site (Mustapha Fadhlullah — independent security researcher)

**Exit check (P6: the ui-studio quality bar passes in a real browser, contrast pairs written out): MET with the named
exceptions below.** Design record: `design/p6/PLAN.md`. Live: https://inspo-4bb4fe2c.base44.app (`/` is the site; the maker's
console moved to `/today`, `/desk`, `/orders`, `/rates`, `/settings`, behind sign-in; the console brand links back to `/`).

**What was built.** Hero (headline, the one filled button, the real photo with a printing docket), how it works (three steps,
recomposed so it is not three equal columns), a price list read live from the `RateCard` (sizes drawn to scale as cake boards,
add-ons with dotted leaders), FAQ whose numbers (deposit, notice, delivery areas) come from the same card, a closing CTA, a
footer that says it is a sample. A live-numbers strip renders only when real counts exist (`publicStats`, counts only); it
renders nothing today.

**Direction.** Three hero directions were rendered with the `prototype` picker (Docket, Tag, Thread) and screenshotted at 1280
and 375. Docket was picked: the other two failed the hierarchy contract on a point each (Tag: no "what next" and a cramped
breakdown; Thread: the quote fell below the fold). Runner-up: Tag. The separate `variant` pass on the docket was **not run**;
the three directions were three treatments of that one component. The exploration page was deleted as the skill requires.
Boldness: the docket printing. Everything else is flat pistachio paper, cocoa ink and one raspberry accent.

**Skills used, and the one that was not.** `ui-studio` (phases 1-7), `frontend-design`, `better-colors`, `prototype`,
`emil-design-eng`, `animate`, `break`, `better-interface` (applied by hand, checks and escalation triggers, not pasted). **NOT
available in this environment, so NOT run:** `ecc:design-system` audit, `ecc:click-path-audit`, `ecc:browser-qa`,
`ecc:frontend-design-direction`, `ecc:make-interfaces-feel-better`. I did the same jobs with my own scripts and say so. No
subagents were used, so the "blind critic" was the inline SEMI-BLIND version.

**Signature moment (beat sheet in PLAN.md section 9).** The docket prints top-down (clip-path, 700ms, strong ease-out) then the
stamp lands (260ms; the one overshoot, as a real rubber stamp does). CSS keyframes, not Motion: predetermined motion that must
stay smooth while the page loads. It is announced once through an `aria-live` region; the replay link re-announces it.
- VERIFIED by filmstrip at 1x (`eval/browser/filmstrip.mjs`) and at 10% speed (`filmstrip-slow.mjs`); I looked at both.
- Reduced motion: only a 200ms fade runs, the end-state text is identical and the announcement is present.
- Frame times (headless, software rendering, NOT a phone or a GPU): 89 frames, max 16.8ms, none over 33ms. The sampler caught
  its planted 80ms stall (read 67ms).

**Corrections and bugs found by looking, not by building (each fixed):**
1. **A production deploy that skipped `base44 build` shipped `apps/undefined`.** Every data call from the live site returned 404
   (the landing prices, the console). My earlier "the live gate works" check only saw the sign-in screen, which renders even when
   the backend is unreachable. **CORRECTION to my earlier P4/P5 claims:** they were verified against the local backend only; the
   deployed console was not working until this fix. Always deploy with `base44 deploy -y --build`, and probe the deployed page's
   network requests, not its first paint. Now VERIFIED: the data calls return 200 and the CTA resolves to the real agent URL.
2. **The print animation never ran** (clip-path cannot animate between a shape and `none`; both keyframes must be `inset()`).
   Found only by filming at 10% speed; the 1x filmstrip was too sparse to show it.
3. **The stamp covered the total and the deposit** on the docket; it now has its own row.
4. **The naira sign (U+20A6) is missing from both fonts** (checked with fontkit), so it fell back to a different system font
   on every device. Two `@font-face` rules carry only that glyph, from Noto Serif Black (display) and Inter (body).
5. **The page title was still "Todo App"** and the favicon hotlinked Base44's logo (the scorer showed the title). Now a real
   title, description, `icon.svg` and a 1200x630 social card cut from the settled docket frame.
6. **Design-token faults found by measuring, not eyeballing:** `eval/hue-distance.mjs` found my first palette had the accent only
   3.0x the loudest surface (floor 4x), two amber roles at dE 13 in dark mode, and accent text at 4.43:1 on blush. All fixed in
   `tokens.css`. The first console was also in the cream-serif default cluster; it now shares the new tokens.
7. Header broke at 320px (both lines wrapped), the headline took four lines at 1024px, and at 1024 the docket covered the photo.
   Found by looking at the width screenshots, not by the overflow probe (which passed).
8. `break` (Docket and the price list under long unbreakable names, huge totals, 60 decorations, 12 sizes, loading, error, empty):
   long names now wrap, the total scales to fit, the docket can shrink. One scenario is **not fixed on purpose**: a docket
   squeezed to 52px by a 260px flex sibling, which the product never does.
9. My own probes failed twice and were fixed rather than trusted: the frame-time control threshold (70ms was too strict for a
   planted 80ms stall) and the axe control, which I had planted outside the root I then scoped it to.

**Measured results**
- Contrast (`node eval/contrast.mjs`): 20 pairs x light and dark, lowest 4.53:1; control black/white 21.00.
- Hue distance and chroma (`node eval/hue-distance.mjs`): every role pair at least dE76 20 (lowest 20.2); accent 4.6x (light) and
  4.7x (dark) the chroma of the loudest surface; control near-identical 0.7, far apart 92.0.
- `ui-score` (`.claude/skills/ui-studio/scripts/ui-score.mjs`, three planted controls passed every round): 79, 82, 86, 86 (plateau,
  rounds 3 and 4 identical). One auto-fail tell (three equal columns) and one major (multiple accents) were fixed. Left, named:
  `gradient-in-declaration-only` (the conic-gradient mask that tears the docket's bottom edge), `missing-hover-state` (the scorer's
  browser does not satisfy `(hover: hover) and (pointer: fine)`; I verified the hover state directly: the CTA goes from
  oklch(.52 .2 8) to oklch(.45 .19 8)), `no-overflow-clip` and `two-accent-tokens` (the button colour and its text colour).
  `disabledStates` 0/5: the landing page has no control that can be disabled. `tokenDiscipline` and `stateCoverage` are "unknown" in
  URL mode.
- Click path (`eval/browser/journey.mjs`, 12 checks), content states and keyboard (`states.mjs`, 12), browser QA (`qa.mjs`, 27):
  console errors 0; LCP element is the hero photo (not lazy, not faded); CLS 0.0006 to 0.049 against a planted control that moved
  it to 0.2-0.3; axe zero violations of any impact; no broken, missing-alt or oversized images (each with a planted control);
  hit areas all at least 40px (planted 20px control caught). LCP timings (about 0.5s local, 0.9 to 1.4s deployed) are headless on
  software rendering and are not a claim about phones.
- Eight widths, light and dark (`widths.mjs`, 16 checks, per-element overflow with a planted 2000px control): clean. I looked at
  320, 375, 768, 1024, 1280, 1440 and 1920.
- Production: journey 12/12, states 12/12, browser QA 27/27, filmstrip, all against the deployed URL.

**Image floor.** The hero is the product's own input and output (R1) on a public-domain photo (R4); the price list needs none
(real prices fill the view); the console shows the customer's photo. **There is no gallery of "her cakes": there is no real
maker, and other people's photos shown as hers would mislead.** `CREDITS.md` has the photo and fonts.

**Platform constraints, named, not hidden**
- The deployed page carries Base44's free-plan **"Made with Base44" badge** (`#base44-edit-badge`, outside the app root). Its logo,
  18px close button and missing landmark are the platform's, so the deployed probes are scoped to the app's own `#root` and say so.
  Removing it needs a paid plan.
- Clicking the CTA redirects (302) to `wa.me/<the agent's number>` with a pre-filled activation message the visitor just sends
  (`getWhatsAppConnectURL`, VERIFIED live). The WhatsApp conversation itself has not been re-run since the `saveQuote` redesign.

**Not verified / open**
- The dark theme was looked at (1280, 375) but the full pass at all widths was measured only for overflow.
- No real maker, photos, copy or brand exist; the palette is derived from the cake world, not from her logo (she has none).
- Live counts are untested on production with real data (zero now, so the strip is hidden).
- The signed-in console on the deployed URL has still not been driven (I cannot sign in as him in a headless browser).
- Tidy-up still owed: the old test Quotes and Customer in production data.

## 2026-10-20 · P5 automations, and a UI review pass (Mustapha Fadhlullah — independent security researcher)

**Exit check as planned ("`base44 logs` shows each automation firing once"): NOT POSSIBLE, and the reason is the
finding.** Workflows is **Builder plan and above**; the Free plan cannot create or run them
(https://docs.base44.com/Building-your-app/Creating-workflows, Warning at the top). Function automations
(`function.jsonc`) are disabled for this app (HTTP 409 `workflows_enabled`, found earlier). So on the free plan
there is **no way to schedule anything or trigger on a data change.** He said no plan upgrade, so P5 changed shape.
The rubric word "automation" is therefore only partly met, and I will not describe it as more than it is.

**What was built instead (each real, none faked):**
1. **Today screen** (`/today`, now the landing route). `src/lib/reminders.js` works out what is due from the
   records, and the maker sends each with one tap (`wa.me` link with the message filled in), copies it, or marks it
   sent. Rules: deposit unpaid and the order is 24 h old (not repeated within 24 h, not for past pickups); pickup
   tomorrow (carries the balance, or the whole total plus a deposit chase if the deposit is unpaid); a pending quote
   older than 24 h (links to the quote). "Sent" is saved on `Order.reminders_sent`, so a reload does not offer it
   again. The page says plainly that sending is by her, one tap, and that scheduled sending needs a paid plan.
2. **New-quote email alert**, inside `saveQuote` (no automation needed): opt-in through `Maker.notify_email`
   (Settings), off by default because each email uses an integration credit. VERIFIED on production: the call
   returned `alerted: true` (one real email to his address, one integration credit). Locally `SendEmail` is not
   supported and the quote still saved with `alerted: false`, so a failed email cannot lose a quote.
3. **Order confirmation to the customer:** unchanged from P4; approving shows the message and a send link. Spike C
   (can a function message a customer first?) is still not tested. The docs say people must message first and a
   24-hour window applies, so I am not building on it.
- The reminder logic is pure and clock-free. If a paid plan or the coupon later unlocks Workflows, a scheduled
  workflow can call the same rules.

**Verification (VERIFIED, `eval/browser/today.mjs`, part of `run-all.sh`):** planted control first (with the real
clock nothing is due, so the list is not always full), then the browser clock is moved two days ahead with
Playwright's `page.clock`: pickup, deposit and the waiting quote appear; the pickup message shows the balance
(49,000 - 34,300 = 14,700); the deposit message shows 34,300; "mark as sent" and tapping Send both save to the order;
a reload does not bring them back. 78 unit tests.
- **Mistakes of mine, corrected in place:** (a) my first reminder test said the balance was ₦15,700; the sum is
  ₦14,700. (b) the first browser run failed twice because my checks were wrong (the Desk step had already approved a
  quote, and `innerText` returns the CSS-uppercased heading), not because the app was; the checks now read counts
  from the API and match case-insensitively.

**UI review pass (looked at screenshots at 390, 768, 1280, 1920 and in dark):**
- Today: kind was repeated in title and badge, the "See the message" disclosure had no marker, and three buttons
  wrapped unevenly. Now: title is the customer, the badge names the kind, a chevron marks the disclosure, the main
  action is full width with two quiet ones beneath.
- Prices had no currency symbol anywhere. Now every price input and label carries it (`currencySymbol`, tested).
- Rates was very long on a phone (4930 px). Two-field rows now sit beside a small remove button (4254 px).
- A "missing" Settings field in a full-page screenshot was the sticky header painted over it, not a bug (the input
  exists with its value and a 44 px box). Fixed bars mid-page in full-page captures are likewise capture artefacts.

**Still open:** a WhatsApp run on the new `saveQuote` flow (credits); old test Quote(s) and the Customer from his
phone are still in production data; `/` is the maker sign-in until P6.

## 2026-10-20 · P4 maker console (Mustapha Fadhlullah — independent security researcher)

**Exit check (P4: approve a pending quote on a phone viewport and see the Order on the calendar): PASSED against the
local `base44 dev` backend; NOT run signed in on the live URL.** I cannot sign in as him in a headless browser, so
on production I verified only the signed-out gate and the permissions (below). `eval/browser/run-all.sh` reproduces
the local run: 21 checks green, plus 8 widths x 4 routes with no horizontal scroll.

**What exists:** `/desk` (queue + quote detail: photo, flags he must tick, editable lines with an edit log, approve,
decline, WhatsApp send link, copy message), `/orders` (14-day strip, day agenda, deposit received, status flow,
two-tap cancel), `/rates` (every rate-card field, validated), `/settings`. Owner-only sign-in gate.

**Architecture change, and why.** The agent used to write `Quote`/`Customer` through entity tools and call
`priceQuote` itself. Now its only write path is the function `saveQuote`: it prices server-side from the stored rate
card, re-saves the photo, creates the Quote (`pending_approval`) and links the sender. The agent never supplies a
number. Reasons: (1) the model no longer touches any price; (2) entities can be admin-only; (3) fewer model turns, so
fewer credits (UNMEASURED until a WhatsApp run on this flow, which costs credits I do not have).
- **Rejected:** `{{user.email}}`-based entity rules. The docs say a rule that references `user.*` blocks anonymous
  callers outright (https://docs.base44.com/developers/backend/resources/entities/security), and WhatsApp customers
  are anonymous, so the agent's writes would have failed.
- **Permissions (VERIFIED live, `node eval/anon-access.mjs <url> <appId>`):** an anonymous read of Quote, Customer
  and Order returns `[]`; `RateCard` and `Maker` are public on purpose (the agent needs them). The probe has a planted
  control (the public RateCard must return rows, or it exits 2 "PROBE BROKEN"; verified by giving it a wrong app id).
- `linkCustomer` (the automation I built earlier) was deleted: folded into `saveQuote`.

**Bugs the verification found (all fixed, all with a check that would catch them again):**
1. `saveQuote` returned 500 when the sender was unknown: it sent `customer_id: null` and the schema rejects null.
   Fix: omit nulls (`compact.js`, tested). Found by seeding the local database, not by reading code.
2. `/rates` scrolled sideways at 375 and 414 px. Found by the overflow probe (planted 3000px element proves it is
   not blind). Fix: `minmax(0,1fr)` columns, `min-width:0` on fields.
3. At 1280 px the quote panel was cramped (name wrapped). Found by looking at the screenshot. Fix: photo beside
   details only from 1440 px.
4. The deposit percentage lived on both Maker and RateCard. Console now reads the rate card only (the same one the
   agent and engine use). `Maker.deposit_percent` is left in the schema, unused.
5. The agent stripped the token from the photo URL, so stored photos could not load. Instructions now say to pass the
   URL unchanged, and `saveQuote` re-saves the photo under our own link (verified locally: reachable photo gets a new
   link; an unreachable one still saves the quote with the original link). UNVERIFIED on production: whether
   `UploadFile` costs integration credits.

**Verification notes (each cost time, keep them)**
- Contrast, MEASURED (`node eval/contrast.mjs`): 16 pairs x light and dark, all >= 5.6:1 (lowest: danger on the
  warning surface, dark, 5.64). Planted control: black/white = 21.00, mid-grey/white = 2.67 (fails, as it should).
  Measured from the tokens, not from rendered pixels.
- Planted controls: a known-disabled and a known-enabled button for the "Approve is disabled" probe; a 3000px
  element for the overflow probe; the public RateCard for the permissions probe.
- Headless Chromium crashed at launch (SIGTRAP) when `TMPDIR` pointed into the scratchpad; unset it.
- `pkill -f` and `pgrep -f` match the shell running them and kill it (exit 144). Use the `[b]racket` pattern.
- The local `base44 dev` backend logs the dev account in with any password
  (`POST /api/apps/<id>/auth/login`); tokens go in `localStorage.base44_access_token`. Entity data is in memory and
  is wiped on restart. `base44 exec --local` seeds it. Run the dev server without the proxy variable
  (`NO_PROXY=localhost`), or Vite's own `/api` proxy gets 504s.
- Local seed data uses two public Wikimedia cake photos and "Local test customer" names. It is throwaway UI test
  data and is not committed (photos) or counted anywhere.
- The live page shows a "Made with ..." badge (free plan). Check it before P8.

**Still open**
- One WhatsApp run on the new flow (photo -> `saveQuote` -> reply) on the cheaper `automatic` model: needs credits.
- The two old test Quotes and the Customer from his phone are still in production data; delete before a real run.
- `/` redirects to `/desk`, so a public visitor lands on a sign-in screen. The public site is P6.
- P5 must be built as Workflows (see the 409 note below), not `function.jsonc` automations.

## 2026-10-20 · P0-P2 status (Mustapha Fadhlullah — independent security researcher)

**Phase exit checks, run honestly**

| Phase | Exit check | Result |
|---|---|---|
| P0 | three spikes recorded with transcripts | **NOT PASSED.** Spike A: negative control only (below). Spike B and C need his phone and the dashboard. No cake photo has been run yet. |
| P1 | `npm test` green, `CLAIMS.md` lists the command | **PASSED on the arithmetic**, with a test-only rate card. Her real card is still an open input. |
| P2 | `node eval/run.mjs` reproduces the table | **NOT STARTED.** Blocked on the 15-20 past orders and her rate card. |

**Inputs still blocking (section 1 of `implementation.md`):** the maker and her written yes, her rate card, the
past-orders eval set, her real photos. Nothing in the repo pretends otherwise: the only rate card in the repo is
labelled `TEST FIXTURE ONLY` in `app/tests/pricing.test.js`.

**Environment (VERIFIED, live)**
- `base44.com`, `app.base44.com`, `docs.base44.com`, the npm registry all returned HTTP 200 once network was opened.
- The CLI (0.1.33) logs in by device code: it prints a code and `https://app.base44.com/login/device`, he confirms
  it in his browser. The process must stay alive while he confirms.
- **Node's built-in fetch ignores the container's proxy.** Without `NODE_USE_ENV_PROXY=1` the CLI fails with
  `fetch failed`. Working invocation:
  `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npx base44@latest ...` (Node 22.22).
- `base44 exec` needs Deno (`npm i -g deno`, 2.9.6) plus `DENO_TLS_CA_STORE=system SSL_CERT_FILE=/root/.ccr/ca-bundle.crt`.
- `base44 exec` failed with "App not found" until the first `base44 deploy -y` had run.
- Non-interactive CLI needs `-y` on `deploy` and `entities push`; `functions deploy` has no `-y`.

**The app (VERIFIED, live):** `inspo`, app id `6ad73f07dd0047fa4bb4fe2c`, URL https://inspo-4bb4fe2c.base44.app,
visibility public. Created with `create inspo -p app -t backend-and-client --no-skills`.

**What `create` scaffolds (VERIFIED, file listing):** Vite 6 + React 18, **Tailwind 3 + shadcn `components.json`**,
`base44/{agents,entities,agent-skills,config.jsonc}`, a sample `Task` entity and `task_manager` agent. Tailwind,
shadcn, the sample entity, agent and skill were removed (commit "remove Tailwind and template"). House stack in
place: CSS Modules, `motion` (not yet used), vitest.

**Deviation from the plan, marked.** `implementation.md` puts pricing in `base44/shared/pricing.ts`. The functions
docs say every `.js/.ts/.json/.jsonc` file *inside the function's own directory* is deployed with it, and say
nothing about imports from outside it (UNVERIFIED). So the module lives at
`app/base44/functions/priceQuote/pricing.js` and tests import it from there. Plain JS rather than TS so vitest and
Deno load the same file with no build step.

**Entities (VERIFIED, live):** `Maker`, `RateCard`, `Customer`, `Quote`, `Order` pushed. The push printed
`Warning: Deleted: User`. I did not define a User entity; I read this as the built-in `User` having no custom
schema locally. UNVERIFIED that nothing was lost; the app has no users yet.

**Pricing core (VERIFIED, `cd app && npm test`, 13 tests):** tier price x height x finish, plus decorations, flavour,
rush, delivery. Money is an integer. A tier size or decoration she does not price, an unknown finish or flavour, a
confidence under 0.6, or an event date inside the lead time goes to `needs_check` and sets `complete: false`; the
module never guesses a price for something missing. Unknown finish prices the tiers at 1x and is flagged, so the
total is provisional until she fixes it.

**extractFeatures (VERIFIED, live):** deployed. It sends `file_urls` and `response_json_schema` to
`Core.InvokeLLM` ([SDK doc, llms-full.txt section "InvokeLLM"](https://docs.base44.com/llms-full.txt)), then
`normalise()` coerces the result and **drops any key outside the schema, a smuggled `price` included** (unit test).
- Negative control, live: a solid blue PNG uploaded with `UploadFile` returned
  `{"unreadable":true,"notes":"... solid blue square with no visible cake ..."}`. So the call path works:
  UploadFile -> InvokeLLM with an image and a JSON schema -> normalise.
- **Not yet done:** a positive run on real cake photos, the model comparison (cost vs accuracy), credits per call.
  A probe that only passes on a blank image proves the plumbing, not the accuracy. Credits per call are UNKNOWN: I
  have no documented way to read the balance from the CLI.
- Wikimedia Commons rate-limited this container's shared IP (HTTP 429) when I tried to pull a public cake photo for
  the probe, so I stopped rather than retry. Real photos from the maker are the right input anyway.

- **Positive run, live (2026-10-20), two public Wikimedia Commons photos used as technical probes only** (not product
  content, not in the repo): `Wedding_cake_with_pillar_supports,_2009.jpg` and `Pound_layer_cake.jpg`.
  Wedding cake returned 3 round fondant tiers (6/8/12 in, confidence 0.8), a topper, 25 red sugar roses, 75 servings;
  the layer cake returned 1 round 8 in buttercream tier, 12 small piped rosettes (type `other`), 16 servings. Both
  came back schema-valid with no price key. **Accuracy is not established:** I have no ground truth for these
  photos, so I only know the output is well-formed and plausible, not right. The 6/8/12 in sizes are the model's
  estimate from proportions. Credits per call still unknown. Only the P2 eval against her real orders measures accuracy.

**Spike B prep (2026-10-20).** `inspo_desk` agent written (`app/base44/agents/inspo_desk.jsonc`) and pushed
(VERIFIED: `agents push` printed `Created: inspo_desk`). Tools: Maker/RateCard read, Customer and Quote
read/create/update, functions `extractFeatures` and `priceQuote`. Model `claude-sonnet-5`. Instructions forbid the
agent from computing any number itself.
- **TEST DATA, to delete before the real run:** Maker `6ad74876930fb883233bd335` ("SPIKE TEST (not a real maker)")
  and RateCard `6ad7487677622aa7c007f90a`, created by `eval/seed-spike-test-data.mjs`, so the agent has something
  to price against. They are not the maker's numbers.
- Live check of the deployed `priceQuote` against that card: 8 in buttercream + 4 sugar flowers returned
  3,000,000 + 600,000 = 3,600,000, `complete: true`. Matches the hand sum.
- UNVERIFIED until the WhatsApp run: how the agent receives the photo's file URL to pass as `image_url`; whether
  Quote creation and both function calls fire in one turn; whether a function tool can read RateCard id from context.
- The WhatsApp connection itself is a dashboard step (Dashboard -> Agents -> inspo_desk -> Edit Agent -> WhatsApp).

**Spike B result (2026-10-20, VERIFIED live, WhatsApp from his phone; conversation read with
`base44.agents.getConversation` under `base44 exec --privileged`).** The thin path works end to end:
1. Photo in -> agent called `extractFeatures` with the photo URL and it returned 8 in, round, semi_naked, 8
   decorations of type `other`, 12 servings. **The image handoff works** (it was UNVERIFIED). The URL the agent
   receives is a private `media.base44.com` link with a JWT that expires after 1 hour (`exp - iat = 3600`).
2. It asked for event date and pickup/delivery, then flavour, one question at a time, as instructed.
3. `priceQuote` returned 3,300,000 + 200,000 = 3,500,000 kobo with `needs_check: ["decorations[0].type",
   "event_date"]`, `complete: false`. The agent created a Quote `pending_approval` and told the customer the maker
   must confirm; it did not call the price final. The edge path I most wanted to see held.
4. The agent turned kobo into naira itself ("₦35,000"). Correct this time, but that is the model touching a
   number. **Fix shipped:** `priceQuote` now returns `amount_display` and `total_display`; the agent is told to copy
   them verbatim (2 new tests, 15 total).
Defects seen, not fixed yet:
- `create_Quote` returned an empty draft (the payload was dropped); the agent recovered with `update_Quote`. The
  final record is complete, but it is two calls and relies on the agent noticing. UNVERIFIED why create drops fields.
- **No `Customer` record was created** and `Quote.customer_id` is null: the agent looked for the WhatsApp user id,
  found nothing and moved on. I do not yet know how to get the sender's id into the agent. Open.
- The saved `Quote.image_url` is the private link; the token is stripped in the stored copy, so it will not load
  without one. The console (P4) must re-host the photo with `UploadFile` at intake.
- Credits: the per-message usage block shows `credits_charged: 10` on some assistant turns and null on others, and
  the tool-call turns carry 8-12k prompt tokens each. A whole quote took about 10 model turns. Exact credits per
  quote are NOT measured: the balance is only visible on the Credit usage page in the dashboard.
- Test records (`Quote 6ad757600468a25bfe4ed7ce`, the SPIKE TEST maker and rate card) are test data to delete before
  the real run.

**Customer link (2026-10-20).** Problem: the agent could not see the sender, so `Quote.customer_id` was null.
- Finding (VERIFIED live): the conversation's `metadata.phone_number` and each message's
  `additional_message_params.whatsapp_from` carry the sender. The agent has no tool that reads them.
- **CORRECTION to my first attempt.** I built `linkCustomer` as an entity automation on Quote. Deploy failed with
  HTTP 409 `workflows_enabled`: this app uses Workflows, so legacy entity automations cannot be deployed (the docs
  warn of this: https://docs.base44.com/developers/backend/resources/backend-functions/automations). Consequence for
  P5: **automations must be built as Workflows, not `function.jsonc` automations.** Re-plan P5 around
  `base44 workflows` before writing any.
- Second finding (VERIFIED live): `asServiceRole.agents.listConversations` returns 0 conversations; the
  user-scoped client returns them. So `linkCustomer` now runs as an **agent tool** (the agent calls it with
  `quote_id`), not as a service job. Direct call with the existing test Quote created a Customer from the
  conversation's phone number and set `customer_id` (`linked: true`).
- UNVERIFIED: whether a function called by the agent on behalf of an anonymous WhatsApp customer receives that
  customer's user context. The test above ran as the app owner, whose own WhatsApp is the connected account.
  Needs one more WhatsApp run to confirm the agent calls the tool and it links.
- Note: in that test the conversation belongs to the owner's account (`created_by_email` was `anonymous` on the
  messages, but the conversation's `created_by_id` is his user id). A real customer may look different.

**Credits and model (2026-10-20).** Credit usage page, as he read it out: message credits 0/25, daily 0/5,
integration credits 48.1/100, renews Nov 1 2026 00:00 UTC. These are the free-plan limits; no coupon is applied
(he could not find the challenge code). I read 48.1 as used, so about 52 integration credits remain: UNVERIFIED
reading of the page.
- Measured: one WhatsApp quote conversation cost `summary.credit_count: 30` (13 messages, about 10 model turns of
  8-12k prompt tokens, on `claude-sonnet-5`).
- Decision: switch `inspo_desk` to `model: "automatic"` (docs: "a fast, low cost model tuned for everyday tasks",
  https://docs.base44.com/developers/backend/resources/models.md). Rejected: staying on `claude-sonnet-5` while the
  budget is about one more conversation.
- Risk, UNVERIFIED: a cheaper model may call the tools less reliably or break the "copy display strings verbatim"
  rule. It needs one WhatsApp run to check, and the check is: did it call extractFeatures, priceQuote, create the
  Quote, call linkCustomer, and quote exactly the returned `total_display`? Credits per quote after the switch:
  NOT YET MEASURED.

**Sample data adopted (2026-10-20). He could not get a real bakery and told me to use the ChatGPT data.**
- Source: https://chatgpt.com/share/6ad7a43d-ec34-83ea-a7a9-12e77717ce8f ("Create Demo Cake Data"). Read in full. The
  conversation invented "Aminat's Cake Studio" / "Aminat Bello" and says the amounts are "invented for testing" and
  the orders "fictional ... not real customer records". The "maker's" message was written by ChatGPT, not a person.
- **CORRECTION to my plan.** `implementation.md` and `CLAUDE.md` say no fictional bakery. He overrode that. I
  complied on one condition that I will keep: **the data is labelled SAMPLE everywhere it appears** (data folder,
  entities via `data_origin: "sample"`, README, eval, and any screen or video that shows it). I refused his earlier
  request to hide it from the judges and I still do. Rejected: presenting it as a real maker or real past orders.
- Files: `data/sample/{rate-card,orders}.json` + README. Eval: `eval/run.mjs`, `eval/README.md`.
- Engine change: the sample card is **additive** (flat fondant/tall/flavour surcharges), not multiplicative. Added
  to `priceQuote`: finish and height surcharges, flat vs per-unit decorations, price ranges (low end quoted and
  flagged), percentage rush tiers (flags `rush_availability`), delivery zones (flags an unknown zone), deposit.
  Tests first (red 6 failed, then 24/24 green). The old multiplicative path still passes its tests.
- Eval (VERIFIED, `node eval/run.mjs`): 15 orders, 11 exact, median error 0%, worst 10%. **This is circular and is
  not accuracy**: the sample prices came from the same list. Pricing only, no photos. Details in `eval/README.md`.
- App data (VERIFIED, live): the SPIKE TEST maker/rate card were deleted and replaced by "Aminat Bello (sample)" +
  rate card with `data_origin: "sample"`. Live `priceQuote` on the new card: 8" + drip + topper = 4,900,000 kobo
  (₦49,000), deposit 3,430,000 (₦34,300), matching the chat's own example.
- Not done: no photos exist for the 15 orders, so extraction accuracy is still unmeasured; the old test Quote and
  Customer records (from the owner's own phone) are still in the app and must be deleted before any real run.

**Facts from the docs (VERIFIED, URLs)**
- Agents are defined in `base44/agents/<name>.jsonc` and synced with `agents push` (a full sync: remote agents not
  present locally are deleted): https://docs.base44.com/developers/backend/resources/agents/overview
- Agent fields: `name, description, instructions, model` required; `tool_configs` (entity tools with
  `allowed_operations`, function tools with `function_name` + `description`), `whatsapp_greeting`,
  `selected_skill_names`. Model ids: `claude-sonnet-5`, `claude_opus_5_5`, `claude_fable_5_1`, `gpt_6_*`,
  `gemini_3_8_flash`, `glm_5_2`, or `automatic`: https://docs.base44.com/developers/backend/resources/models.md
- WhatsApp (https://docs.base44.com/Building-your-app/AI-agents-for-apps): images and voice supported; **people must
  send the first message**; a public app makes people log in unless **Allow anonymous access** is on in the agent's
  Guidelines tab; integration credits only (1 per message relayed plus LLM costs); connecting is done in the
  dashboard (Dashboard -> Agents -> Edit Agent -> WhatsApp). Whether the CLI can do it: UNVERIFIED.
- Consequence for **Spike C** (outbound): "people must send the first message" and the 24-hour window mean a backend
  function cannot be assumed able to message a customer first. Still UNVERIFIED; the plan's fallback (email, or the
  maker sends with one tap) stands until Spike C runs.

**Next, in order:** (1) he sends 3 real cake photos (or the maker's) so Spike A gets a positive run; (2) Spike B: the
`inspo_desk` agent connected to WhatsApp, tested from his phone; (3) the maker's rate card replaces the fixture;
(4) the eval harness `eval/run.mjs` once the past orders exist.

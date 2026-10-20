# DECISIONS

Newest first. Each entry: what was measured, what was rejected, where the evidence is. Tags: VERIFIED (doc URL, file
or live response) or UNVERIFIED. Corrections are made in place and marked CORRECTION.

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

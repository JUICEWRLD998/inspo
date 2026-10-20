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

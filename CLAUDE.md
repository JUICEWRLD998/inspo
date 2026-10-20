# Inspo: working rules for Claude sessions

Owner: Mustapha Fadhlullah. Byline on anything a stranger reads: `Mustapha Fadhlullah — independent security
researcher`. First person singular in his voice; impersonal in report prose.

**Start here:** `implementation.md` is the build order (phases P0-P9, each with an exit check). Read it fully, then
continue from the first phase whose exit check has not passed. Record progress in `DECISIONS.md`.

## Standing rules (from him; not negotiable)
- **No subagents** unless he says "fan out" in that session. Do the work inline, in sequence.
- **He presses submit.** Never post to X or LinkedIn, never message the maker's customers in bulk, never submit to
  Contra. Draft it and hand it over.
- **No fake anything.** No fictional bakery, no invented customers, no hardcoded "live" numbers, no mocked core path.
  Our own test activity is never adoption. Record metrics as measured, unavailable or zero.
- **The model never owns a number.** Prices come from the deterministic `priceQuote` and her rate card.
- **Days left never shrinks the product.** Scope is cut only by the MVP / stretch / NOT BUILDING list.
- **Tag every Base44 claim** VERIFIED (doc URL, file:line or live response) or UNVERIFIED. Never invent an SDK
  method, endpoint or parameter. Check docs (docs.base44.com, `llms.txt`) or context7 first.
- **Secrets** go in Base44 secrets (`npx base44@latest secrets set`) or the environment, never in the repo. Grep
  before every push.
- Strategy and win-odds notes are not in this repo and never go in it.
- When a claim turns out wrong, correct it in place and mark the correction. Never quietly rewrite it.

## Skills
All his skills are in `.claude/skills/`. When a skill says `~/.claude/skills/<name>/...`, read
`.claude/skills/<name>/...` in this repo instead. Skills that call Windows paths (`C:\Users\fadhm\...`) or
Windows-only tools need a Linux equivalent here; say so instead of skipping silently.
- Build spine: `hackathon-strategy` → `references/build-and-ship.md` (Stage B).
- Plans and tests: `plan`, `test-driven-development`, `systematic-debugging`, `diagnosing-bugs`.
- UI: `ui-studio` (the pipeline; its `references/toolbox.md` maps `frontend-design`, `emil-design-eng`, `animate`,
  `review-animations`, `break`, `better-interface` and the rest).
- Product: `product-hardening` (demo-seam audit), `attacker` (one pass on the finished product).
- Packaging: `demo-video` (the video from the deployed link), `humanizer` (all public copy).
- ECC plugin skills (`ecc:browser-qa`, `ecc:verification-loop`, `ecc:e2e-testing`) come from the ECC plugin, if the
  session loaded it (`.claude/settings.json`). If not, use Playwright directly.

**Lessons go back into the skills.** When a pass teaches something durable (a trap, a wrong assumption, a probe that
lied), write it into the governing skill file under `.claude/skills/`, in that skill's Pitfalls, replacing the
wording it supersedes, and say so in the commit message. He syncs these back to his machine.

## Stack
- Base44 app: entities, backend functions (Deno), app agent on WhatsApp, automations; deployed with
  `npx base44@latest deploy`.
- Frontend: React with **CSS Modules + design tokens**. **No Tailwind** (remove it if the scaffold adds it).
  **`motion`** is the only animation library, imported from `motion/react`.

## His design taste (it bites if ignored)
- He wants clean, top-tier polish and rejects anything that looks AI-generated. Motion and imagery where they earn
  their place: **one choreographed signature moment** (here: the quote card assembling next to the inspo photo),
  real images on every key route (her real cakes, never stock), feedback motion on every state change.
- His own products use "SIGNAL DECK" (flat deep blue-black, one mint-teal accent). **This site is the maker's brand,
  so do not apply it here.** Derive the vocabulary from her world: her cakes, colours and words. Measured OKLCH
  palette with 2-3 support hues and tinted surfaces; one accent = one CTA colour.
- **Do not clone a reference's grammar.** Learn why a reference reads well; never copy its look.
- **Every screen width**, never mobile-only: look at screenshots at 320, 375, 414, 768, 1024, 1280, 1440 and 1920 px,
  with each band composed. No sample or filler text: show real data, or say plainly there is none.

## Verification rules (each one cost him real time)
- **Drive a browser; never infer the rendered state.** Grepping built HTML and reading build exit codes "verified"
  an invisible primary button three times. Use Playwright (`npx playwright install chromium` in the cloud) to
  click, then screenshot and look at the result. If you cannot see it, say so.
- **Contrast is measured, never eyeballed.** Write the WCAG ratio for every foreground/background pair.
- **Match the metric to the question.** "Are these two colours different?" needs CIE Lab ΔE, not the contrast
  ratio. "Which element is quietest?" needs chroma, not luminance.
- **Every DOM probe gets a planted positive control** that must fail on purpose before a pass is trusted. A probe
  must exclude its own planted control from its sample.
- **Kill CSS transitions before a synchronous `getComputedStyle` read** (`transition: none !important`, read,
  restore), or you read the previous frame.
- **A stale server serving dead asset hashes looks like broken CSS.** Diff the asset hashes in the served HTML
  against what is on disk before debugging styles. Kill the old process or use a fresh port.
- **CSS Modules hash class names**: select with `[class*="name"]`, never `.name`.
- **Headless Chrome defaults to `prefers-color-scheme: dark`.** Set the scheme explicitly in light-mode checks.
- **A probe asserts a mechanism; when the mechanism changes, it lies instead of failing.** When a check fails, ask
  first: is this the app, or my check? Probe the app's own state, not a structural guess.
- A green typecheck is not a demo. Run the judge's path on the deployed URL from a clean browser.

## Commits
Real, small commits with descriptive messages. Never skip hooks. Never force-push `main`.

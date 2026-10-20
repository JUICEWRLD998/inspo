# CLAIMS

Each README claim, and the command that reproduces it.

| Claim | Reproduce |
|---|---|
| Pricing is deterministic, integer, sums to the total, flags what it cannot price | `cd app && npm test` (`tests/pricing.test.js`) |
| The extraction layer drops any price the model returns | `cd app && npm test` (`tests/extract.test.js`) |
| `extractFeatures` returns `unreadable: true` for a non-cake image, live | `cd app && PROBE_IMAGE=<any non-cake png> npx base44@latest exec < ../eval/spike-a.mjs` (needs Deno and the proxy env in `DECISIONS.md`) |
| Five entities exist on the deployed app | `cd app && npx base44@latest entities push -y` lists them (Created on first run) |
| Three functions are deployed (extractFeatures, priceQuote, saveQuote) | `cd app && npx base44@latest functions list` |
| The engine reproduces the sample price list (11 of 15 sample orders exact, worst 10%); sample data, circular, not accuracy | `node eval/run.mjs` |
| An anonymous visitor cannot read quotes, customers or orders on the live app | `node eval/anon-access.mjs https://inspo-4bb4fe2c.base44.app 6ad73f07dd0047fa4bb4fe2c` |
| Every colour pair is at least 4.5:1 in light and dark | `node eval/contrast.mjs` |
| The console approves a quote, creates the order, and has no horizontal scroll from 320 to 1920 px (local backend) | `PHOTOS=<dir> eval/browser/run-all.sh` |
| Reminders (deposit, pickup tomorrow, waiting quotes) appear when due, not before, and are not offered again once sent (local backend, fake clock) | `PHOTOS=<dir> eval/browser/run-all.sh` (runs `eval/browser/today.mjs`) |

Not claimed yet: scheduled or automatic sending of anything, accuracy against a real baker's orders, extraction accuracy on cakes, price error against her real orders, any WhatsApp behaviour.

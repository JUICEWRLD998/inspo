# CLAIMS

Each README claim, and the command that reproduces it.

| Claim | Reproduce |
|---|---|
| Pricing is deterministic, integer, sums to the total, flags what it cannot price | `cd app && npm test` (`tests/pricing.test.js`) |
| The extraction layer drops any price the model returns | `cd app && npm test` (`tests/extract.test.js`) |
| `extractFeatures` returns `unreadable: true` for a non-cake image, live | `cd app && PROBE_IMAGE=<any non-cake png> npx base44@latest exec < ../eval/spike-a.mjs` (needs Deno and the proxy env in `DECISIONS.md`) |
| Five entities exist on the deployed app | `cd app && npx base44@latest entities push -y` lists them (Created on first run) |
| Two functions are deployed | `cd app && npx base44@latest functions list` |

Not claimed yet: extraction accuracy on cakes, price error against her real orders, any WhatsApp behaviour.

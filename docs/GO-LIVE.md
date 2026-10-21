# Going live with a real maker

Inspo runs on a sample studio today. Nothing below is done until a real baker has said yes in writing. The plan's
cutoff for that yes is 2026-10-22 12:00 local; the challenge deadline is 2026-10-25 23:59 PDT.

## What the maker must give you
1. Written consent (a WhatsApp message is enough, keep a screenshot outside this repo): she agrees to trial Inspo,
   to her customers' quotes being logged, and to the numbers being shown publicly as counts only.
2. Her real prices: sizes, finishes, flavours, decorations, delivery areas, notice and rush rules, deposit percentage.
3. Her payment note (bank details wording), her WhatsApp number, her brand name and first name.
4. Optionally 15-20 past orders with photos, for the accuracy eval (`eval/run.mjs`). Her own cake photos for the site.

## Steps (all from the signed-in console unless noted)
1. Sign in at `/today` as the owner. **Settings**: replace business name, name, city, WhatsApp display number,
   notify email, payment note. **Rates**: enter her price list. Do not touch `data_origin` yet.
2. In Desk, open every old quote from testing and tick "This is a test, don't count it in the numbers".
   (`eval/` scripts can do the same for many at once; see `DECISIONS.md` P7.)
3. Settings -> **Go live** -> "This studio is real". This sets `data_origin: "real"` on the Maker and RateCard.
   The public page then shows her name, drops the sample notices and the sample demo quote and photo.
4. Connect WhatsApp: Dashboard -> Agents -> `inspo_desk` -> WhatsApp (or `getWhatsAppConnectURL("inspo_desk")`).
   Turn on "Allow anonymous access" in the agent's Guidelines tab. Send one photo yourself and mark that quote as a test.
5. She shares the number (her status, Instagram, regulars). **You never generate activity.** Our own test quotes stay
   marked as tests.
6. Record the numbers: from `app/`, with Deno installed (`npm i -g deno`):
   `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt npx base44@latest exec --privileged < ../eval/live.mjs`
   This writes `eval/live.json`: quotes received/answered, approvals, declines, median minutes to approve, edit rate,
   needs-check rate, orders, deposits confirmed, and how many test quotes were left out. The site's proof strip uses the
   same counting code (`publicStats/stats.js`), so the two cannot disagree.
7. Deploy changes with `npx base44@latest deploy -y --build` (a plain `npm run build` ships a broken app id).

## What counts
- Counted: quotes the maker did not mark as test. "Answered" means she approved it. Edit rate = approved quotes she edited
  before approving, over approved quotes. It is the honest accuracy number.
- Never counted: anything marked test, and the orders made from it. Activity from a sample studio is never adoption;
  `live.json` says so when `makerDataOrigin` is not `real`.
- A zero or `null` is reported as zero or `null`. Do not round up.

## Still unverified at this point
- The WhatsApp flow after the `saveQuote` redesign and the `automatic` model (costs integration credits).
- Spike C (outbound reminders to a customer).
- The signed-in console on the deployed URL (a headless browser cannot sign in as the owner).

# P6 design plan: the public site

Written 2026-10-20 by Mustapha Fadhlullah — independent security researcher (design pass run through `ui-studio`,
`frontend-design`, `better-colors`). Nothing here is strategy; it is the design record.

## 0. Pre-flight (what exists, with citations)

- Routes: `app/src/App.jsx:12-31`. Everything sits behind `AuthGate` today (`:13`), so `/` is the maker sign-in.
  P6 splits it: `/` public, the console routes stay gated.
- Tokens: `app/src/styles/tokens.css` (rewritten for P6, see section 4). Fonts were system stacks
  (`tokens.css` before this commit, `--font-display: "Iowan Old Style"...`), which is the cream-and-serif default.
- Console shell: `app/src/components/Shell.jsx`, `Shell.module.css`. It inherits the new tokens, so the console and
  the site are one brand.
- Data on hand: `data/sample/rate-card.json` (SAMPLE), the live `RateCard` and `Maker` entities (public read), a
  real captured quote at `app/src/site/demo-quote.json` (deployed `extractFeatures` + the pricing engine).
- Imagery on hand: two licensed photos (below). No real maker, so no real gallery.

## 1. Ground

**Subject.** Aminat's Cake Studio, a made-to-order cake maker in Lagos. **It is a SAMPLE studio** (invented in a
ChatGPT conversation; see `data/sample/README.md`). The site says so, plainly and once, near the top and in the
footer. It does not pretend to be a real bakery.

**Audience.** (1) A customer who has a picture of the cake they want and is tired of "DM for price". (2) A judge who
has never seen this and has 30 seconds.

**The one job of the landing page.** Get a visitor to send their inspo photo on WhatsApp, after showing them, in
one look, what they will get back.

**The wow moment (the signature).** A real quote printing out beside the real photo it was made from, line by line,
ending on the total and a stamp saying the baker still has to confirm. This is the product's mechanism acting.

### Vocabulary sheet (the cake studio's own world)

| Kind | Things |
|---|---|
| Documents | the order docket (carbon pad, perforated edge, a number in the corner), the price tent card, the cake-box label, the deposit receipt |
| Materials | pistachio paste, buttercream blush, cocoa, parchment, gold cake-board foil, the string on a box |
| Instruments | the ruler (inches are the unit: 6", 8", 10"), the piping nozzle, the cake leveller, the turntable |
| Marks | a rubber stamp ("CONFIRMED"), a gold foil edge, a tied bow, a piped rosette |
| Verbs | send the inspo, get the price, approve, deposit, pickup, "DM for price" (the thing we replace) |

### Hierarchy contract, first viewport (the blind critic is scored against this)

- **Where am I:** a cake studio's site (name, Lagos, made to order), marked as a sample.
- **What matters most:** a photo of a cake and a priced quote for it, side by side, with a total.
- **What can I do:** one filled button, "Send us your inspo", opening WhatsApp.
- **What just happened:** a quote was worked out from that photo (it prints in).
- **What next:** the price list, how it works, the questions people ask.

### ONE boldness

The docket printing. Everything else is quiet: flat colour, no gradients, no glass, one accent used only on the CTA
and the stamp.

## 2. Imagery plan (ladder: R1 first, then R4 licensed)

| Screen | Image | Rung | Note |
|---|---|---|---|
| Landing hero | the photo the quote was made from, beside the docket | R1 (the product's own input and output) over an R4 licensed photo | public domain, `Pound layer cake.jpg` by Scheinwerfermann |
| Landing, price list | none: the data is the content | skip, reason: real prices fill the viewport | |
| Landing, how it works | the docket crop and a chat bubble drawn as text, not a picture | R1 | no drawn phone chrome |
| Maker console screens | the customer's photo is the image | R1 | already built |
| Gallery of "her cakes" | **not built.** There is no real maker and no real cakes. Showing other people's photos as hers would mislead | | revisit when a real maker supplies photos |
| Wedding cake photo | kept for variety in exploration only | R4, CC BY 2.0 "shine oa" (credit in `CREDITS.md`) | |

## 3. Type

- **Display: Caprasimo** (OFL). A soft, fat serif with the look of a hand-painted bakery sign. Used for the
  headline, the docket total and nothing else, so it stays special. No italics, no single accented word.
- **Body and UI: Figtree Variable** (OFL). A friendly geometric sans with tabular figures, so prices line up.
- Both self-hosted through `@fontsource`. Line length is capped near 62ch; headings use `text-wrap: balance`.

## 4. Colour (OKLCH, measured; both schemes designed)

| Token | Light | Job |
|---|---|---|
| `--paper` | oklch(95.8% 0.028 135) | page ground, pistachio paste |
| `--card` | oklch(98.8% 0.01 125) | raised surface, icing, and the docket paper |
| `--ink` / `--ink-2` | oklch(26% 0.04 40) / oklch(42% 0.04 45) | cocoa text |
| `--accent` | oklch(52% 0.2 8) | raspberry: the CTA and the stamp, nothing else |
| `--foil` | oklch(80% 0.13 88) | the docket's gold edge |
| `--blush` | oklch(92.5% 0.05 5) | buttercream surface |
| `--ok`, `--check`, `--danger` | measured in `tokens.css` | status |

Measured, not eyeballed:
- `node eval/contrast.mjs`: every text pair at least 4.5:1 in light and dark (lowest 4.53:1), black/white control
  21.00:1.
- `node eval/hue-distance.mjs`: every pair of role hues at least ΔE76 20 (lowest 20.2) and the accent at least 4x
  the chroma of the loudest surface (4.6x light, 4.7x dark). **This instrument found three real faults in my first
  palette** (accent only 3.0x the surface chroma; two amber roles at ΔE 13 in dark; accent text 4.43:1 on blush) and
  each was fixed in the tokens.
- Surfaces are tinted toward the palette hue (chroma 0.01 to 0.038), never neutral grey. No gradients, no glass.

## 5. Review against the five default clusters (frontend-design)

| Cluster | My plan | Verdict |
|---|---|---|
| cream + serif + terracotta | pistachio ground, raspberry accent, a soft fat sign-painter serif | **The first version of the console was in this cluster** (cream, Iowan/Georgia serif). Revised: new ground, accent hue and face, with the reason being the subject (pistachio, cocoa, raspberry are the cakes). |
| near-black + one acid accent | light ground, no neon | clear |
| broadsheet hairlines, zero radius | rounded, soft; hairlines only inside the docket | clear |
| SaaS card kit | the docket is one unique object; sections are open typography, not identical cards | clear, to be re-checked on the render |
| eyebrow / middot / mono / arrow chrome | none by plan: no eyebrows, no middot strings in headings, no mono, no arrows on buttons | to be re-checked on the render (the Today screen in the console still has middot meta strings; noted) |

## 6. Three principles

1. The product is the picture: a real input beside a real output, never an illustration of one.
2. One loud thing per screen. The docket is loud; the rest is paper and ink.
3. Honest by default: sample data is labelled, a range is shown as a range, a number is never typed in by hand.

## 7. Copy rules (`better-writing`)

Sentence case, plain verbs, no time claims we have not measured (the plan's "about 20 seconds" is not stated until
the live reply time is measured), no invented customers, no invented counts. The CTA says what happens: "Send us
your inspo".

// WCAG 2.x contrast for every text/background pair the site and console use, measured from the tokens
// (OKLCH -> sRGB -> relative luminance). The theme is light only. Fails the run if any pair is under 4.5:1.
// Planted control: black on white must read 21:1 and mid-grey on white must fail, or the maths is broken.
import { readTokens, ratio } from "./lib/oklch.mjs";

const { light } = readTokens();
const white = { L: 1, C: 0, h: 0 }, black = { L: 0, C: 0, h: 0 }, grey = { L: 0.7, C: 0, h: 0 };
const controlHigh = ratio(black, white), controlLow = ratio(grey, white);
if (Math.abs(controlHigh - 21) > 0.05 || controlLow >= 4.5) {
  console.error(`CONTRAST MATHS BROKEN: black/white ${controlHigh.toFixed(2)}, grey/white ${controlLow.toFixed(2)}`);
  process.exit(2);
}
console.log(`control ok: black on white ${controlHigh.toFixed(2)}:1, mid-grey on white ${controlLow.toFixed(2)}:1 (fails as it should)`);

const PAIRS = [
  ["ink", "paper", "body text"], ["ink", "card", "text on cards"], ["ink", "paper-2", "text on tinted surface"],
  ["ink-2", "paper", "secondary text"], ["ink-2", "card", "secondary text on cards"], ["ink-2", "paper-2", "nav hover, badges"],
  ["on-accent", "accent", "primary button"], ["on-accent", "accent-hover", "primary button hover"],
  ["accent", "paper", "active nav label"], ["accent", "card", "active nav on bar"],
  ["ok", "ok-bg", "approved badge, sent panel"], ["check", "check-bg", "flag chips, sample badge"],
  ["danger", "paper", "error text"], ["danger", "card", "decline button"], ["danger", "check-bg", "error on warning surface"],
  ["ink", "ok-bg", "message preview on sent panel"],
  ["accent", "paper-2", "accent link on tinted surface"],
];
let failed = false;
for (const [scheme, t] of [["light", light]]) {
  for (const [fg, bg, use] of PAIRS) {
    const r = ratio(t[fg], t[bg]);
    const ok = r >= 4.5;
    failed ||= !ok;
    console.log(`${scheme.padEnd(5)} ${ok ? "PASS" : "FAIL"} ${r.toFixed(2).padStart(5)}:1  ${fg} on ${bg}  (${use})`);
  }
}
process.exit(failed ? 1 : 0);

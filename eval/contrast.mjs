// WCAG 2.x contrast for every text/background pair the console uses, in both colour schemes, measured from the
// tokens (OKLCH -> sRGB -> relative luminance). Fails the run if any pair is under 4.5:1.
// Planted control: black on white must read 21:1 and mid-grey on white must fail, or the maths is broken.
import { readFileSync } from "node:fs";

const css = readFileSync("app/src/styles/tokens.css", "utf8");
const blocks = {
  light: css.slice(css.indexOf(":root {"), css.indexOf("@media")),
  dark: css.slice(css.indexOf(":root:not")),
};
const parse = (block) =>
  Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+)?\)/g)]
    .map((m) => [m[1], { L: +m[2] / 100, C: +m[3], h: +m[4] }]));
const light = parse(blocks.light);
const dark = { ...light, ...parse(blocks.dark) };

function toLinear({ L, C, h }) {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const [l, m, s] = [l_ ** 3, m_ ** 3, s_ ** 3];
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
  return rgb.map((v) => Math.min(1, Math.max(0, v))); // clip to gamut
}
const lum = (c) => { const [r, g, b] = toLinear(c); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

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
];
let failed = false;
for (const [scheme, t] of [["light", light], ["dark", dark]]) {
  for (const [fg, bg, use] of PAIRS) {
    const r = ratio(t[fg], t[bg]);
    const ok = r >= 4.5;
    failed ||= !ok;
    console.log(`${scheme.padEnd(5)} ${ok ? "PASS" : "FAIL"} ${r.toFixed(2).padStart(5)}:1  ${fg} on ${bg}  (${use})`);
  }
}
process.exit(failed ? 1 : 0);

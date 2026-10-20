// OKLCH -> sRGB -> WCAG luminance and CIE Lab (D65) for ΔE76. Shared by contrast.mjs and hue-distance.mjs.
import { readFileSync } from "node:fs";

export function readTokens(path = "app/src/styles/tokens.css") {
  const css = readFileSync(path, "utf8");
  const darkAt = css.indexOf(":root:not");
  const blocks = { light: css.slice(css.indexOf(":root {"), darkAt === -1 ? undefined : css.indexOf("@media")), dark: darkAt === -1 ? "" : css.slice(darkAt) };
  const parse = (block) => Object.fromEntries([...block.matchAll(/--([a-z0-9-]+):\s*oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+)?\)/g)].map((m) => [m[1], { L: +m[2] / 100, C: +m[3], h: +m[4] }]));
  const light = parse(blocks.light);
  return { light, dark: { ...light, ...parse(blocks.dark) } };
}

export function toLinear({ L, C, h }) {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const [l, m, s] = [l_ ** 3, m_ ** 3, s_ ** 3];
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s].map((v) => Math.min(1, Math.max(0, v)));
}

export const lum = (c) => { const [r, g, b] = toLinear(c); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

export function lab(c) {
  const [r, g, b] = toLinear(c);
  const X = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b, Y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b, Z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const [fx, fy, fz] = [f(X / 0.95047), f(Y), f(Z / 1.08883)];
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}
export const deltaE76 = (p, q) => { const x = lab(p), y = lab(q); return Math.hypot(x.L - y.L, x.a - y.a, x.b - y.b); };
export const chroma = (c) => { const x = lab(c); return Math.hypot(x.a, x.b); };

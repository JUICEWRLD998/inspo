// "Are these colours different?" is a ΔE question, not a contrast question (instrument-traps.md).
// Every pair of role hues must be ΔE76 >= 20 in both schemes; the accent must out-chroma every surface 4x.
// Planted control: two near-identical colours must read under 5, or the maths is broken.
import { readTokens, deltaE76, chroma } from "./lib/oklch.mjs";

const same = deltaE76({ L: 0.6, C: 0.1, h: 30 }, { L: 0.6, C: 0.1, h: 31 });
const far = deltaE76({ L: 0.3, C: 0.1, h: 30 }, { L: 0.8, C: 0.1, h: 200 });
if (same >= 5 || far < 40) { console.error(`HUE MATHS BROKEN: near-identical ${same.toFixed(1)}, far ${far.toFixed(1)}`); process.exit(2); }
console.log(`control ok: near-identical ΔE ${same.toFixed(1)}, far apart ΔE ${far.toFixed(1)}`);

const ROLES = ["accent", "ok", "check", "danger", "foil", "blush"];
const SURFACES = ["paper", "paper-2", "card"];
const t = readTokens();
let failed = false;
for (const scheme of ["light", "dark"]) {
  const p = t[scheme];
  for (let i = 0; i < ROLES.length; i++) for (let j = i + 1; j < ROLES.length; j++) {
    const d = deltaE76(p[ROLES[i]], p[ROLES[j]]);
    const ok = d >= 20;
    failed ||= !ok;
    if (!ok || process.argv.includes("--all")) console.log(`${scheme.padEnd(5)} ${ok ? "PASS" : "FAIL"} ΔE ${d.toFixed(1).padStart(5)}  ${ROLES[i]} vs ${ROLES[j]}`);
  }
  const maxSurface = Math.max(...SURFACES.map((s) => chroma(p[s])));
  const ratio = chroma(p.accent) / maxSurface;
  failed ||= ratio < 4;
  console.log(`${scheme.padEnd(5)} ${ratio >= 4 ? "PASS" : "FAIL"} accent chroma ${chroma(p.accent).toFixed(1)} vs loudest surface ${maxSurface.toFixed(1)} (${ratio.toFixed(1)}x, floor 4x)`);
}
process.exit(failed ? 1 : 0);

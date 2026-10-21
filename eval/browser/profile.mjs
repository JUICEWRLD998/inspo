// The public page follows the Maker record. Intercepts the Maker read and asserts, in a real browser, that
// a real studio shows none of the sample copy and a sample studio still does (the planted positive control).
// Needs the dev server (run-all.sh starts it). Usage: node eval/browser/profile.mjs
import { launch, BASE } from "./lib.mjs";

const maker = (over) => ({ id: "m1", name: "Tolu Adeyemi", brand: "Crumb & Co", city: "Abuja", currency: "NGN", data_origin: "real", ...over });
const b = await launch();

async function visit(makerRecord) {
  const ctx = await b.newContext({ colorScheme: "light", viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  await p.route(/\/entities\/Maker(\?|$)/, (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify([makerRecord]) }));
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.waitForSelector("header a[class*=brand]");
  await p.waitForTimeout(400);
  const out = await p.evaluate(() => ({
    text: document.body.innerText,
    brand: document.querySelector("header a[class*=brand]")?.textContent,
    heroPhoto: Boolean(document.querySelector("#hero-title")?.closest("section")?.querySelector("img")),
    title: document.title,
  }));
  await p.screenshot({ path: `eval/shots/profile-${makerRecord.data_origin}.png` });
  await ctx.close();
  return out;
}

const sample = await visit(maker({ brand: "Aminat's Cake Studio (sample data)", name: "Aminat Bello (sample)", data_origin: "sample" }));
const real = await visit(maker());
await b.close();

const fails = [];
const check = (ok, msg) => !ok && fails.push(msg);
// Control: the probe must see the sample copy where it belongs, or "absent on the real page" proves nothing.
check(/Sample studio/.test(sample.text) && sample.heroPhoto && /Aminat/.test(sample.text), "CONTROL: sample page lost its sample copy, the probe is blind");
check(real.brand === "Crumb & Co", `real brand was ${real.brand}`);
check(!/sample|invented|Aminat/i.test(real.text), "real page still shows sample or Aminat copy");
check(/Tolu/.test(real.text), "real page never names the maker");
check(!real.heroPhoto, "real page still shows the sample demo photo");
check(/Crumb & Co/.test(real.title) && !/sample/i.test(real.title), `title was ${real.title}`);
console.log(fails.length ? `FAIL\n- ${fails.join("\n- ")}` : "profile ok: sample control seen, real studio clean");
process.exit(fails.length ? 1 : 0);

// The same replay filmed at 10% speed (Animation.setPlaybackRate) so every beat of the beat sheet is visible.
// CSS animations slow down; compare with the 1x run to know which kind was filmed. Frames tiled into one sheet to LOOK at.
import { launch, BASE } from "./lib.mjs";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
const out = "eval/shots/filmstrip-slow";
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const b = await launch();
const ctx = await b.newContext({ ignoreHTTPSErrors: Boolean(process.env.PW_PROXY), colorScheme: "light", viewport: { width: 1280, height: 800 } });
const p = await ctx.newPage();
await p.goto(`${process.env.LANDING_URL ?? BASE}/`, { waitUntil: "networkidle" });
await p.waitForTimeout(2200);
const cdp = await ctx.newCDPSession(p);
await cdp.send("Animation.enable");
await cdp.send("Animation.setPlaybackRate", { playbackRate: 0.1 });
const frames = [];
cdp.on("Page.screencastFrame", async (f) => { frames.push({ t: f.metadata.timestamp, data: f.data }); await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); });
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 70, everyNthFrame: 1 });
await p.getByRole("button", { name: "Watch it print again" }).click();
await p.waitForTimeout(12500); // 1.25s of animation at 0.1x
await cdp.send("Page.stopScreencast");
frames.sort((x, y) => x.t - y.t);
const t0 = frames[0].t;
frames.forEach((f, i) => writeFileSync(`${out}/f-${String(i).padStart(3, "0")}.jpg`, Buffer.from(f.data, "base64")));
console.log(`captured ${frames.length} frames over ${((frames.at(-1).t - t0)).toFixed(1)}s of wall time (animation time = x0.1)`);
// pick 12 evenly spaced frames, cropped to the hero stage, so the docket is big enough to read
const pick = Array.from({ length: 12 }, (_, i) => Math.floor((i * (frames.length - 1)) / 11));
pick.forEach((idx, i) => execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", `${out}/f-${String(idx).padStart(3, "0")}.jpg`, "-vf", "crop=720:520:560:110", `${out}/pick-${String(i).padStart(2, "0")}.jpg`]));
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", "1", "-i", `${out}/pick-%02d.jpg`, "-vf", "scale=400:-1,tile=4x3", "-frames:v", "1", `${out}/sheet.jpg`]);
console.log("pick:", pick.join(","), "->", `${out}/sheet.jpg`);
await b.close();

// Spike A probe. Run from app/: PROBE_IMAGE=/path/to/photo.jpg npx base44@latest exec < ../eval/spike-a.mjs
// (exec needs Deno on PATH; in the cloud container: npm i -g deno)
import { readFileSync } from "node:fs";
const file = new File([readFileSync(process.env.PROBE_IMAGE)], "probe.png", { type: "image/png" });
const up = await base44.integrations.Core.UploadFile({ file });
console.log("uploaded", JSON.stringify(up));
const res = await base44.functions.invoke("extractFeatures", { image_url: up.file_url });
console.log("extract", JSON.stringify(res.data ?? res));

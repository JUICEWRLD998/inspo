import { createClientFromRequest } from "npm:@base44/sdk";
import { FEATURE_SCHEMA, normalise } from "./schema.js";
import { checkImageUrl } from "./guard.js";

const PROMPT = `You describe a photo of a cake a customer wants made. Report only what is visible:
tiers (estimate each diameter in inches from proportions; a tall tier is clearly taller than wide),
shape, finish, decorations with counts and sizes, text written on the cake, colours.
Give a confidence from 0 to 1 for every tier and decoration; lower it when you are guessing.
NEVER mention prices, costs or money. If the image is not a cake, or you cannot make it out, set unreadable to true.`;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const { image_url } = await req.json();
    if (!image_url) return Response.json({ error: "image_url required" }, { status: 400 });
    const guard = checkImageUrl(image_url);
    if (!guard.ok) return Response.json({ error: guard.reason }, { status: 400 });
    const raw = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: PROMPT,
      file_urls: [image_url],
      response_json_schema: FEATURE_SCHEMA,
    });
    return Response.json(normalise(typeof raw === "string" ? JSON.parse(raw) : raw));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}

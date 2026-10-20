import { createClientFromRequest } from "npm:@base44/sdk";
import { computeStats } from "./stats.js";

// Public, read-only, counts only. Runs with the service role because Quote and Order are private to the maker.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const db = base44.asServiceRole;
    const [quotes, orders] = await Promise.all([db.entities.Quote.list("-created_date", 1000), db.entities.Order.list("-created_date", 1000)]);
    return Response.json(computeStats(quotes, orders, new Date().toISOString()));
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}

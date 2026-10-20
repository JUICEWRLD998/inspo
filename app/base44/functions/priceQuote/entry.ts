import { createClientFromRequest } from "npm:@base44/sdk";
import { priceQuote } from "./pricing.js";

// Price a feature set against the maker's rate card. Pure arithmetic: see pricing.js.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const { features, rate_card_id, event_date, delivery, flavour } = await req.json();
    const rateCard = await base44.asServiceRole.entities.RateCard.get(rate_card_id);
    if (!rateCard) return Response.json({ error: "rate card not found" }, { status: 404 });
    const quote = priceQuote({
      features,
      rateCard,
      eventDate: event_date,
      now: new Date().toISOString(),
      delivery: Boolean(delivery),
      flavour: flavour ?? null,
    });
    return Response.json(quote);
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}

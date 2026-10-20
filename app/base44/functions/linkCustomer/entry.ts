import { createClientFromRequest } from "npm:@base44/sdk";

// The agent cannot see the sender's number, but the conversation metadata holds it. Do the join in code,
// not in the model. Called by the agent as a tool with { quote_id }.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
        const quoteId = body.quote_id ?? body.event?.entity_id ?? body.data?.id ?? body.entity_id;
    if (!quoteId) return Response.json({ error: "no quote id in payload" }, { status: 400 });

    const db = base44.asServiceRole;
    const quote = await db.entities.Quote.get(quoteId);
    if (!quote) return Response.json({ skipped: "quote not found" });
    if (quote.customer_id) return Response.json({ skipped: "already linked" });

    // Conversations are scoped to the caller: the service role sees none (measured), the agent's own
    // user context sees the customer's conversation. So this runs as an agent tool, not an automation.
    const convs = await base44.agents.listConversations({ agent_name: "inspo_desk" });
    const mine = convs
      .filter((c: any) => c.created_by_id === quote.created_by_id && c.metadata?.phone_number)
      .sort((a: any, b: any) => String(b.updated_date).localeCompare(String(a.updated_date)));
    const phone = mine[0]?.metadata?.phone_number;
    if (!phone) {
      return Response.json({
        skipped: "no whatsapp conversation for this quote",
        diag: { convs: convs.length, quote_created_by: quote.created_by_id, conv_created_by: convs.map((c: any) => c.created_by_id) },
      });
    }

    const existing = await db.entities.Customer.filter({ whatsapp_id: phone });
    const customer =
      existing[0] ??
      (await db.entities.Customer.create({
        whatsapp_id: phone,
        first_seen_at: new Date().toISOString(),
        orders_count: 0,
      }));
    await db.entities.Quote.update(quoteId, { customer_id: customer.id });
    return Response.json({ linked: true, customer_id: customer.id });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}

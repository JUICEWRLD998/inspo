import { createClientFromRequest } from "npm:@base44/sdk";
import { priceQuote } from "./pricing.js";
import { compact } from "./compact.js";

// The agent's only write path. It prices on the server from the stored rate card, saves the Quote, and links
// the WhatsApp sender, so the model never supplies a number and never touches the Quote entity directly.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const { features, image_url, event_date, flavour, delivery, rate_card_id, servings } = await req.json();
    if (!features) return Response.json({ error: "features required" }, { status: 400 });
    const db = base44.asServiceRole;

    const rateCard = await db.entities.RateCard.get(rate_card_id);
    if (!rateCard) return Response.json({ error: "rate card not found" }, { status: 404 });

    const now = new Date().toISOString();
    const priced = priceQuote({
      features, rateCard, eventDate: event_date, now, flavour: flavour ?? null, delivery: delivery ?? false,
    });
    if (priced.needs_check.includes("unreadable")) {
      return Response.json({ saved: false, unreadable: true, needs_check: priced.needs_check });
    }

    // Conversations are scoped to the caller: the service role sees none (measured 2026-10-20).
    let customerId = null;
    try {
      const convs = await base44.agents.listConversations({ agent_name: "inspo_desk" });
      const phone = convs
        .filter((c: any) => c.metadata?.phone_number)
        .sort((a: any, b: any) => String(b.updated_date).localeCompare(String(a.updated_date)))[0]?.metadata?.phone_number;
      if (phone) {
        const found = await db.entities.Customer.filter({ whatsapp_id: phone });
        const customer = found[0] ?? (await db.entities.Customer.create({ whatsapp_id: phone, first_seen_at: now, orders_count: 0 }));
        customerId = customer.id;
      }
    } catch (_) {
      customerId = null; // an unlinked quote is still a valid quote; the maker sees "customer unknown"
    }

    // The photo link the agent receives is private and expires within the hour. Keep our own copy so the maker
    // can still see the cake tomorrow. If anything fails, keep the original link rather than lose the quote.
    let savedImage = image_url ?? null;
    if (image_url) {
      try {
        const res = await fetch(image_url);
        const type = res.headers.get("content-type") ?? "";
        const bytes = new Uint8Array(await res.arrayBuffer());
        if (res.ok && type.startsWith("image/") && bytes.length > 0 && bytes.length < 10_000_000) {
          const ext = type.split("/")[1]?.split(";")[0] ?? "jpg";
          const up = await db.integrations.Core.UploadFile({ file: new File([bytes], `inspo-${Date.now()}.${ext}`, { type }) });
          savedImage = up.file_url ?? savedImage;
        }
      } catch (_) {
        savedImage = image_url;
      }
    }

    const quote = await db.entities.Quote.create(compact({
      status: "pending_approval",
      customer_id: customerId,
      image_url: savedImage,
      features,
      line_items: priced.line_items,
      total: priced.total,
      currency: priced.currency,
      needs_check: priced.needs_check,
      event_date: event_date ?? null,
      servings: servings ?? features.servings_estimate ?? null,
      flavour: flavour ?? null,
      delivery: delivery ?? null,
      edit_log: [],
    }));

    // Opt-in alert: only when the maker has set an email. A failed email never fails the quote.
    let alerted = false;
    try {
      const maker = (await db.entities.Maker.list())[0];
      if (maker?.notify_email) {
        await db.integrations.Core.SendEmail({
          to: maker.notify_email,
          subject: `New quote waiting: ${priced.total_display}`,
          body: `A customer sent a cake photo and got a price. It is waiting for you to approve.\n\n${priced.line_items.map((l: any) => `${l.label}: ${l.amount_display}`).join("\n")}\nTotal: ${priced.total_display}${priced.complete ? "" : "\n\nSome details need your check before you approve."}\n\nOpen the Desk in your studio app to review it.`,
        });
        alerted = true;
      }
    } catch (_) {
      alerted = false;
    }

    return Response.json({
      saved: true,
      alerted,
      quote_id: quote.id,
      customer_linked: Boolean(customerId),
      photo_saved: savedImage !== (image_url ?? null),
      line_items: priced.line_items.map((l: any) => ({ label: l.label, amount_display: l.amount_display, note: l.note ?? null })),
      total_display: priced.total_display,
      deposit_display: priced.deposit_display ?? null,
      needs_check: priced.needs_check,
      complete: priced.complete,
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { base44 } from "./base44Client";
import { approve } from "../lib/quotes.js";

export const StudioContext = createContext(null);
export const useStudio = () => useContext(StudioContext);

// Small fetch hook: { data, error, loading, reload }. Keeps the previous data while reloading.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const run = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    return fn().then(
      (data) => setState({ data, error: null, loading: false }),
      (error) => setState((s) => ({ ...s, error, loading: false })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    run();
  }, [run]);
  return { ...state, reload: run };
}

export const studioApi = {
  me: () => base44.auth.me(),
  login: () => base44.auth.redirectToLogin(window.location.href),
  logout: () => base44.auth.logout(),

  async loadStudio() {
    const [makers, cards] = await Promise.all([base44.entities.Maker.list(), base44.entities.RateCard.list()]);
    return { maker: makers[0] ?? null, rateCard: cards[0] ?? null };
  },
  updateMaker: (id, data) => base44.entities.Maker.update(id, data),
  updateRateCard: (id, data) => base44.entities.RateCard.update(id, data),

  listQuotes: () => base44.entities.Quote.list("-created_date", 200),
  listCustomers: () => base44.entities.Customer.list("-created_date", 500),
  listOrders: () => base44.entities.Order.list("pickup_or_delivery_at", 500),

  saveQuoteEdits: (quote) =>
    base44.entities.Quote.update(quote.id, {
      line_items: quote.line_items, total: quote.total, edit_log: quote.edit_log,
    }),
  declineQuote: (id, now) => base44.entities.Quote.update(id, { status: "declined", answered_at: now }),
  updateOrder: (id, data) => base44.entities.Order.update(id, data),
  logReminder: (order, reminders_sent) => base44.entities.Order.update(order.id, { reminders_sent }),

  // Order first, then the quote; if the quote write fails, take the order back so nothing is half-approved.
  async approveQuote(quote, { depositPercent, now }) {
    const result = approve(quote, { depositPercent, now });
    const order = await base44.entities.Order.create(result.order);
    try {
      const { id, line_items, total, edit_log, status, approved_at, answered_at } = result.quote;
      await base44.entities.Quote.update(id, { line_items, total, edit_log, status, approved_at, answered_at });
    } catch (e) {
      await base44.entities.Order.delete(order.id).catch(() => {});
      throw e;
    }
    return { quote: result.quote, order };
  },
};

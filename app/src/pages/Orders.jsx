import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { studioApi, useAsync } from "../api/studio";
import { groupByDay, nextStatus, splitUpcoming, stripDays } from "../lib/calendar";
import { display } from "../../base44/functions/priceQuote/pricing.js";
import { Badge, Button, Empty } from "../components/ui";
import styles from "./Orders.module.css";

const STATUS_LABEL = { confirmed: "Confirmed", baking: "Baking", ready: "Ready", collected: "Collected", cancelled: "Cancelled" };
const NEXT_LABEL = { baking: "Start baking", ready: "Mark ready", collected: "Mark collected" };
const dayTitle = (day) =>
  day ? new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) : "No date set";
const time = (iso) => (iso && /T(?!00:00)/.test(iso) ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) : null);

function OrderCard({ order, quote, customer, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const next = nextStatus(order.status);
  const cur = quote?.currency ?? "NGN";

  async function update(data) {
    setBusy(true);
    setError("");
    try {
      await studioApi.updateOrder(order.id, data);
      await onChange();
    } catch (e) {
      setError(`Could not save: ${e.message ?? e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.li layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className={styles.card}>
      {quote?.image_url ? <img className={styles.thumb} src={quote.image_url} alt="" loading="lazy" /> : <span className={styles.thumb} aria-hidden="true" />}
      <div className={styles.info}>
        <div className={styles.top}>
          <strong>{customer?.name ?? (customer ? `+${customer.whatsapp_id}` : "Customer not linked")}</strong>
          <Badge tone={order.status === "cancelled" ? "neutral" : order.status === "collected" ? "ok" : "check"}>{STATUS_LABEL[order.status] ?? order.status}</Badge>
        </div>
        <p className={styles.what}>
          {quote?.line_items?.[0]?.label ?? "Order"}{time(order.pickup_or_delivery_at) ? ` · ${time(order.pickup_or_delivery_at)}` : ""} · {display(order.total, cur)}
        </p>
        <p className={styles.deposit}>
          Deposit {display(order.deposit_due, cur)}:{" "}
          <strong>{order.deposit_status === "paid_confirmed_by_maker" ? "received" : "not received"}</strong>
        </p>
        {order.status !== "cancelled" && (
          <div className={styles.actions}>
            {order.deposit_status !== "paid_confirmed_by_maker" && (
              <Button variant="quiet" busy={busy} onClick={() => update({ deposit_status: "paid_confirmed_by_maker" })}>Deposit received</Button>
            )}
            {next && <Button busy={busy} onClick={() => update({ status: next })}>{NEXT_LABEL[next]}</Button>}
            {order.status !== "collected" && (
              <Button variant="danger" disabled={busy} onClick={() => (confirmCancel ? update({ status: "cancelled" }) : setConfirmCancel(true))}>
                {confirmCancel ? "Tap again to cancel" : "Cancel order"}
              </Button>
            )}
          </div>
        )}
        {error && <p role="alert" className={styles.error}>{error}</p>}
      </div>
    </motion.li>
  );
}

export default function Orders() {
  const { data, error, loading, reload } = useAsync(async () => {
    const [orders, quotes, customers] = await Promise.all([studioApi.listOrders(), studioApi.listQuotes(), studioApi.listCustomers()]);
    return {
      orders,
      quotes: Object.fromEntries(quotes.map((q) => [q.id, q])),
      customers: Object.fromEntries(customers.map((c) => [c.id, c])),
    };
  }, []);

  if (error) return <p role="alert" className={styles.error}>Could not load orders: {String(error.message ?? error)}</p>;
  if (!data) return <p className={styles.quiet}>{loading ? "Loading orders…" : ""}</p>;

  const now = new Date().toISOString();
  const groups = groupByDay(data.orders);
  const { upcoming, past } = splitUpcoming(groups, now);
  const strip = stripDays(groups, now, 14);
  const jump = (day) => document.getElementById(`day-${day}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const Group = ({ g }) => (
    <section id={`day-${g.day}`} className={styles.day} aria-label={dayTitle(g.day)}>
      <h2>{dayTitle(g.day)}</h2>
      <ul className={styles.cards}>
        <AnimatePresence initial={false}>
          {g.orders.map((o) => (
            <OrderCard key={o.id} order={o} quote={data.quotes[o.quote_id]} customer={data.customers[o.customer_id]} onChange={reload} />
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );

  return (
    <div>
      <h1 className={styles.title}>Orders</h1>
      <div className={styles.strip} role="group" aria-label="Next 14 days">
        {strip.map((d) => (
          <button key={d.day} type="button" className={`${styles.pip} ${d.count ? styles.has : ""}`} disabled={!d.count} onClick={() => jump(d.day)} aria-label={`${dayTitle(d.day)}: ${d.count} order${d.count === 1 ? "" : "s"}`}>
            <span>{new Date(`${d.day}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })}</span>
            <strong>{Number(d.day.slice(8))}</strong>
            <i aria-hidden="true">{d.count || ""}</i>
          </button>
        ))}
      </div>

      {data.orders.length === 0 && <Empty title="No orders yet">When you approve a quote, the order lands here on its pickup day.</Empty>}
      {upcoming.map((g) => <Group key={g.day ?? "none"} g={g} />)}
      {past.length > 0 && (
        <details className={styles.past}>
          <summary>Earlier orders · {past.reduce((n, g) => n + g.orders.length, 0)}</summary>
          {past.map((g) => <Group key={g.day} g={g} />)}
        </details>
      )}
    </div>
  );
}

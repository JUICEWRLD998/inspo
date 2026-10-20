import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { studioApi, useAsync, useStudio } from "../api/studio";
import { dueReminders, markSent } from "../lib/reminders";
import { waLink } from "../lib/quotes";
import { Badge, Button, Empty } from "../components/ui";
import styles from "./Today.module.css";

const KIND = {
  pickup: { label: "Pickup tomorrow", tone: "check" },
  deposit: { label: "Deposit", tone: "check" },
  answer: { label: "Waiting for you", tone: "neutral" },
};

function Item({ item, order, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const link = item.message ? waLink(item.phone, item.message) : null;

  async function record() {
    setBusy(true);
    setError("");
    try {
      await studioApi.logReminder(order, markSent(order, item.kind, new Date().toISOString()));
      await onDone();
    } catch (e) {
      setError(`Could not record that: ${e.message ?? e}`);
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(item.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy is blocked in this browser. Open the message below and select it.");
    }
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={styles.item}
    >
      <div className={styles.head}>
        <div>
          <strong>{item.title}</strong>
          <p className={styles.detail}>{item.detail}</p>
        </div>
        <Badge tone={KIND[item.kind].tone}>{KIND[item.kind].label}</Badge>
      </div>

      {item.message && (
        <details className={styles.preview}>
          <summary>See the message</summary>
          <p>{item.message}</p>
        </details>
      )}

      <div className={styles.actions}>
        {item.kind === "answer" ? (
          <Link to={`/desk/${item.quoteId}`} className={styles.primary}>Open the quote</Link>
        ) : (
          <>
            {link ? (
              <a className={styles.primary} href={link} target="_blank" rel="noreferrer" onClick={record}>Send on WhatsApp</a>
            ) : (
              <p className={styles.note}>No number is linked to this customer, so copy the message instead.</p>
            )}
            <Button variant="quiet" onClick={copy}>{copied ? "Copied" : "Copy"}</Button>
            <Button variant="quiet" busy={busy} onClick={record}>Mark as sent</Button>
          </>
        )}
      </div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </motion.li>
  );
}

export default function Today() {
  const { maker, rateCard } = useStudio();
  const { data, error, loading, reload } = useAsync(async () => {
    const [orders, quotes, customers] = await Promise.all([studioApi.listOrders(), studioApi.listQuotes(), studioApi.listCustomers()]);
    return { orders, quotes, customers: Object.fromEntries(customers.map((c) => [c.id, c])) };
  }, []);

  if (error) return <p role="alert" className={styles.error}>Could not load today's list: {String(error.message ?? error)}</p>;
  if (!data) return <p className={styles.quiet}>{loading ? "Checking what is due…" : ""}</p>;

  const now = new Date().toISOString();
  const items = dueReminders({
    orders: data.orders, quotes: data.quotes, customers: data.customers, now,
    brand: maker?.brand ?? "the studio", depositPercent: rateCard?.deposit_percent ?? 0,
    paymentNote: maker?.bank_or_payment_note, currency: rateCard?.currency ?? "NGN",
  });
  const orderById = Object.fromEntries(data.orders.map((o) => [o.id, o]));
  const waiting = data.quotes.filter((q) => q.status === "pending_approval").length;
  const dateText = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className={styles.wrap}>
      <header>
        <p className={styles.date}>{dateText}</p>
        <h1>Today</h1>
      </header>

      <Link to="/desk" className={styles.summary}>
        <strong>{waiting}</strong>
        <span>{waiting === 1 ? "quote is" : "quotes are"} waiting for you to approve</span>
      </Link>

      <section aria-labelledby="due">
        <h2 id="due" className={styles.sub}>To send today · {items.length}</h2>
        {items.length === 0 ? (
          <Empty title="All caught up">No deposits to chase and no pickups tomorrow. New reminders appear here when they are due.</Empty>
        ) : (
          <ul className={styles.list}>
            <AnimatePresence initial={false}>
              {items.map((it) => (
                <Item key={it.id} item={it} order={orderById[it.orderId]} onDone={reload} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <p className={styles.footnote}>
        Reminders are worked out from your orders each time you open this page and are sent by you, one tap each. Scheduled sending needs a paid Base44 plan.
      </p>
    </div>
  );
}

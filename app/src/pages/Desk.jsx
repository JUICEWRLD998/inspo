import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { studioApi, useAsync } from "../api/studio";
import { Badge, Empty } from "../components/ui";
import { display } from "../../base44/functions/priceQuote/pricing.js";
import QuoteDetail from "./QuoteDetail";
import styles from "./Desk.module.css";

const when = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : "no date";

export default function Desk() {
  const { id } = useParams();
  const { data, error, loading, reload } = useAsync(
    async () => {
      const [quotes, customers] = await Promise.all([studioApi.listQuotes(), studioApi.listCustomers()]);
      return { quotes, customers: Object.fromEntries(customers.map((c) => [c.id, c])) };
    },
    [],
  );

  if (error) return <p role="alert" className={styles.error}>Could not load quotes: {String(error.message ?? error)}</p>;
  if (!data) return <p className={styles.quiet}>{loading ? "Loading quotes…" : ""}</p>;

  const { quotes, customers } = data;
  const pending = quotes.filter((q) => q.status === "pending_approval");
  const answered = quotes.filter((q) => q.status !== "pending_approval" && q.status !== "draft");
  const selected = quotes.find((q) => q.id === id);

  const Row = ({ q }) => (
    <li>
      <Link to={`/desk/${q.id}`} className={`${styles.row} ${q.id === id ? styles.current : ""}`}>
        {q.image_url ? <img className={styles.thumb} src={q.image_url} alt="" loading="lazy" /> : <span className={styles.thumb} aria-hidden="true" />}
        <span className={styles.rowText}>
          <strong>{q.is_test && <Badge tone="neutral">Test</Badge>} {customers[q.customer_id]?.name ?? (customers[q.customer_id] ? `+${customers[q.customer_id].whatsapp_id}` : "Customer not linked")}</strong>
          <span className={styles.sub}>For {when(q.event_date)} · {display(q.total ?? 0, q.currency ?? "NGN")}</span>
        </span>
        {q.status === "pending_approval" ? (
          q.needs_check?.length ? <Badge tone="check">{q.needs_check.length} to check</Badge> : <Badge tone="ok">Ready</Badge>
        ) : (
          <Badge tone={q.status === "sent" ? "ok" : "neutral"}>{q.status === "sent" ? "Approved" : q.status}</Badge>
        )}
      </Link>
    </li>
  );

  return (
    <div className={`${styles.layout} ${id ? styles.hasDetail : ""}`}>
      <section className={styles.list} aria-label="Quotes">
        <h1 className={styles.title}>Desk</h1>
        {pending.length === 0 && (
          <Empty title="Nothing waiting">New quotes from WhatsApp appear here as soon as a customer sends a photo.</Empty>
        )}
        {pending.length > 0 && (
          <>
            <h2 className={styles.group}>Waiting for you · {pending.length}</h2>
            <ul className={styles.rows}>{pending.map((q) => <Row key={q.id} q={q} />)}</ul>
          </>
        )}
        {answered.length > 0 && (
          <>
            <h2 className={styles.group}>Answered</h2>
            <ul className={styles.rows}>{answered.map((q) => <Row key={q.id} q={q} />)}</ul>
          </>
        )}
      </section>

      <section className={styles.pane} aria-label="Quote">
        {id && !selected && <Empty title="That quote is gone">It may have been removed. Pick another from the list.</Empty>}
        {selected && (
          <motion.div key={selected.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
            <Link to="/desk" className={styles.back}>← All quotes</Link>
            <QuoteDetail quote={selected} customer={customers[selected.customer_id]} onChanged={reload} />
          </motion.div>
        )}
        {!id && <p className={styles.hint}>Pick a quote to see the photo and the price.</p>}
      </section>
    </div>
  );
}

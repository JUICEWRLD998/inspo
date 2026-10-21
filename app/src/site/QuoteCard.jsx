import demo from "./demo-quote.json";
import styles from "./QuoteCard.module.css";

// The numbers are the captured output of the deployed extractFeatures and the pricing engine (demo-quote.json,
// eval/capture-demo-quote.mjs), shown exactly as returned. Nothing here is typed in by hand.
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function QuoteCard({ quote = demo.quote, depositPercent = 70, baker = "the baker" }) {
  return (
    <div className={styles.card} role="group" aria-labelledby="quote-title">
      <div className={styles.head}>
        <p id="quote-title" className={styles.title}>Your quote</p>
        <span className={styles.status}>Waiting for {baker} to confirm</span>
      </div>
      <ul className={styles.lines}>
        {quote.line_items.map((l, i) => (
          <li key={l.label} className={styles.line} style={{ "--i": i }}>
            <span>
              {cap(l.label)}
              {l.note && <small>{l.note.replace("; low end shown, she confirms.", `. ${baker} picks the amount.`)}</small>}
            </span>
            <span className={styles.amount}>{l.amount_display}</span>
          </li>
        ))}
      </ul>
      <div className={styles.total} style={{ "--i": quote.line_items.length }}>
        <span>Total</span>
        <strong className={styles.amount}>{quote.total_display}</strong>
      </div>
      <p className={styles.deposit} style={{ "--i": quote.line_items.length + 1 }}>
        {depositPercent}% deposit to book: <span className={styles.amount}>{quote.deposit_display}</span>
      </p>
      <p className={styles.sample}>Sample quote for a sample studio.</p>
    </div>
  );
}

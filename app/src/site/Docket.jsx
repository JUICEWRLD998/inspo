import { useState } from "react";
import demo from "./demo-quote.json";
import styles from "./Docket.module.css";

// The signature moment. The numbers are the captured output of the deployed extractFeatures and the pricing engine
// (see demo-quote.json and eval/capture-demo-quote.mjs), shown as returned. Nothing here is typed in by hand.
export default function Docket({ run, quote = demo.quote, depositPercent = 70 }) {
  const [settled, setSettled] = useState(false);
  const q = quote;
  return (
    <div key={run} className={styles.docket} aria-labelledby="docket-title">
      <div className={styles.paper}>
        <div className={styles.head}>
          <h3 id="docket-title">Quote from your photo</h3>
          <span className={styles.sample}>Sample</span>
        </div>
        <ul className={styles.lines}>
          {q.line_items.map((l) => (
            <li key={l.label} className={styles.line}>
              <span>
                {l.label.charAt(0).toUpperCase() + l.label.slice(1)}
                {l.note && <small>{l.note.replace("; low end shown, she confirms.", ". Aminat picks the amount.")}</small>}
              </span>
              <span className={styles.amount}>{l.amount_display}</span>
            </li>
          ))}
        </ul>
        <div className={styles.total}>
          <span>Total</span>
          <strong className={styles.amount}>{q.total_display}</strong>
        </div>
        <div className={styles.deposit}>
          <span>{depositPercent}% deposit</span>
          <span className={styles.amount}>{q.deposit_display}</span>
        </div>
        <div className={styles.stamp} onAnimationEnd={() => setSettled(true)}>
          Waiting for
          <br />
          Aminat
        </div>
      </div>
      <p role="status" className={styles.live}>
        {settled ? `Quote ready: total ${q.total_display}, waiting for Aminat to confirm.` : ""}
      </p>
    </div>
  );
}

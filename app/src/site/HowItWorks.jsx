import demo from "./demo-quote.json";
import styles from "./HowItWorks.module.css";

// Three steps, and it really is a sequence. The pictures are the product's own output: the photo, a line from the
// captured quote, and the stamp.
export default function HowItWorks() {
  const q = demo.quote;
  return (
    <section id="how" className={styles.section} aria-labelledby="how-title">
      <h2 id="how-title">How it works</h2>
      <ol className={styles.steps}>
        <li className={styles.step}>
          <span className={styles.n} aria-hidden="true">1</span>
          <img className={styles.thumb} src="/imagery/layer-cake.webp" alt="" width="828" height="643" loading="lazy" decoding="async" />
          <h3>Send a photo</h3>
          <p>Send the cake you want to the studio on WhatsApp. A picture from Instagram, Pinterest or your phone all work. A clear shot of the whole cake is best.</p>
        </li>
        <li className={styles.step}>
          <span className={styles.n} aria-hidden="true">2</span>
          <div className={styles.mini} aria-hidden="true">
            {q.line_items.map((l) => (
              <div key={l.label} className={styles.miniRow}><span>{l.label.charAt(0).toUpperCase() + l.label.slice(1)}</span><span>{l.amount_display}</span></div>
            ))}
            <div className={`${styles.miniRow} ${styles.miniTotal}`}><span>Total</span><span>{q.total_display}</span></div>
          </div>
          <h3>Get a price from her list</h3>
          <p>The photo is read for size, finish and decorations, and priced from Aminat's own list below. Anything her list does not cover is flagged, not guessed.</p>
        </li>
        <li className={styles.step}>
          <span className={styles.n} aria-hidden="true">3</span>
          <div className={styles.stampWrap} aria-hidden="true"><span className={styles.stamp}>Confirmed</span></div>
          <h3>Aminat confirms</h3>
          <p>She checks the flagged parts, changes anything that needs it, and approves. You pay the deposit to book your date. Nothing is final before she says so.</p>
        </li>
      </ol>
    </section>
  );
}

import { useStats } from "./data";
import styles from "./Proof.module.css";

const minutes = (m) => (m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 6) / 10} h` : `${Math.round(m / 144) / 10} days`);

// Counts from real records via the publicStats function. When there is nothing yet, the section does not render at
// all: no dead zeros, no placeholder numbers. The footer says plainly that counts appear after the first real quote.
export default function Proof() {
  const { status, data } = useStats();
  if (status !== "ready" || !data || !(data.quotesAnswered > 0)) return null;
  return (
    <section className={styles.strip} aria-label="Counted from real quotes">
      <dl>
        <div><dt>Quotes answered</dt><dd>{data.quotesAnswered}</dd></div>
        <div><dt>Typical time to approve</dt><dd>{data.medianReplyMinutes === null ? "n/a" : minutes(data.medianReplyMinutes)}</dd></div>
        <div><dt>Orders in the last 7 days</dt><dd>{data.ordersThisWeek}</dd></div>
      </dl>
    </section>
  );
}

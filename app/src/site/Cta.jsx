import { whatsappUrl } from "./data";
import styles from "./Cta.module.css";

// The one filled button on the page. It opens the real agent's WhatsApp link from the SDK.
export default function Cta({ children = "Send us your inspo", size = "large" }) {
  const href = whatsappUrl();
  if (!href) {
    return <p role="alert" className={styles.unavailable}>The WhatsApp link is not available right now. Please try again in a moment.</p>;
  }
  return (
    <a className={`${styles.cta} ${styles[size]}`} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className={styles.visually}> (opens WhatsApp in a new tab)</span>
    </a>
  );
}

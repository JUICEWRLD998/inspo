import Cta from "./Cta";
import styles from "./Closing.module.css";

export default function Closing() {
  return (
    <section className={styles.section} aria-labelledby="closing-title">
      <h2 id="closing-title">Have a cake in mind?</h2>
      <p>Send us the picture. The price comes back in the chat.</p>
      <Cta />
    </section>
  );
}

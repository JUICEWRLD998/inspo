import { useState } from "react";
import Docket from "./Docket";
import Cta from "./Cta";
import styles from "./Hero.module.css";

export default function Hero() {
  const [run, setRun] = useState(0);
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.copy}>
        <h1 id="hero-title">Send the cake you want. Get the price.</h1>
        <p className={styles.lede}>
          Send a photo of the cake you have in mind on WhatsApp. You get a price worked out from Aminat's own price
          list, and she confirms it before anything is final.
        </p>
        <div className={styles.actions}>
          <Cta />
          <p className={styles.fine}>Opens WhatsApp. No account needed.</p>
        </div>
      </div>
      <div className={styles.stage}>
        <img
          className={styles.photo}
          src="/imagery/layer-cake.webp"
          alt="A layered sponge cake with buttercream rosettes round the top, with a slice cut out to show the layers"
          width="828"
          height="643"
          fetchpriority="high"
          decoding="async"
        />
        <div className={styles.docketSlot}>
          <Docket run={run} />
        </div>
        <button type="button" className={styles.replay} onClick={() => setRun((r) => r + 1)}>
          Watch it print again
        </button>
      </div>
    </section>
  );
}

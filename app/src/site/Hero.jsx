import QuoteCard from "./QuoteCard";
import Cta from "./Cta";
import styles from "./Hero.module.css";

export default function Hero() {
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
          <p className={styles.fine}>Opens WhatsApp with the first message ready. Just press send.</p>
        </div>
      </div>
      <div className={styles.visual}>
        <figure className={styles.photoFig}>
          <img
            className={styles.photo}
            src="/imagery/layer-cake.webp"
            alt="A layered sponge cake with buttercream rosettes round the top, with a slice cut out to show the layers"
            width="828"
            height="643"
            fetchpriority="high"
            decoding="async"
          />
          <figcaption>The photo you send</figcaption>
        </figure>
        <QuoteCard />
      </div>
    </section>
  );
}

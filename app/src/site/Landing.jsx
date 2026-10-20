import SiteHeader from "./SiteHeader";
import Hero from "./Hero";
import HowItWorks from "./HowItWorks";
import Prices from "./Prices";
import Proof from "./Proof";
import Faq from "./Faq";
import Closing from "./Closing";
import SiteFooter from "./SiteFooter";
import styles from "./Landing.module.css";

export default function Landing() {
  return (
    <div className={styles.page}>
      <a className={styles.skip} href="#main">Skip to the content</a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Proof />
        <HowItWorks />
        <Prices />
        <Faq />
        <Closing />
      </main>
      <SiteFooter />
    </div>
  );
}

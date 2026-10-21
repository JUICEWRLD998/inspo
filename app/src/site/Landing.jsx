import { useEffect, useMemo } from "react";
import SiteHeader from "./SiteHeader";
import Hero from "./Hero";
import HowItWorks from "./HowItWorks";
import Prices from "./Prices";
import Proof from "./Proof";
import Faq from "./Faq";
import Closing from "./Closing";
import SiteFooter from "./SiteFooter";
import { ProfileContext } from "./StudioProfile";
import { useMaker } from "./data";
import { studioProfile } from "../lib/studioProfile";
import styles from "./Landing.module.css";

export default function Landing() {
  const { data: maker } = useMaker();
  const profile = useMemo(() => studioProfile(maker), [maker]);

  useEffect(() => {
    if (profile.loaded) document.title = `${profile.brand}${profile.sample ? " (sample)" : ""}: send the cake you want, get the price`;
  }, [profile]);

  return (
    <ProfileContext.Provider value={profile}>
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
    </ProfileContext.Provider>
  );
}

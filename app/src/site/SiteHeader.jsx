import { Link } from "react-router-dom";
import { useProfile } from "./StudioProfile";
import styles from "./SiteHeader.module.css";

export default function SiteHeader() {
  const { brand, sample, loaded } = useProfile();
  return (
    <header>
      {(sample || !loaded) && <p className={styles.notice} style={loaded ? undefined : { visibility: "hidden" }}>Sample studio: an invented bakery, used to show how Inspo works.</p>}
      <div className={styles.top}>
        <Link to="/" className={styles.brand}>{brand}</Link>
        <nav className={styles.nav} aria-label="Site">
          <a href="#how" className={styles.anchor}>How it works</a>
          <a href="#prices" className={styles.anchor}>Prices</a>
          <a href="#questions" className={styles.anchor}>Questions</a>
          <Link to="/today" className={styles.signin}>Maker sign in</Link>
        </nav>
      </div>
    </header>
  );
}

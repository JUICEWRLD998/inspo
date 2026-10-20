import { Link } from "react-router-dom";
import styles from "./SiteFooter.module.css";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.cols}>
        <div>
          <p className={styles.brand}>Aminat's Cake Studio</p>
          <p>
            This is a sample studio. The bakery, its prices and the quote on this page are invented for testing. Live
            counts (quotes answered, time to approve, orders this week) appear here after the first real quote.
          </p>
        </div>
        <nav aria-label="Footer">
          <a href="#how">How it works</a>
          <a href="#prices">Prices</a>
          <a href="#questions">Questions</a>
          <Link to="/today">Maker sign in</Link>
        </nav>
        <div>
          <p>Photo: "Pound layer cake" by Scheinwerfermann, public domain, via Wikimedia Commons.</p>
          <p>Made with Inspo, built on Base44.</p>
        </div>
      </div>
    </footer>
  );
}

import styles from "./HowItWorks.module.css";

const STEPS = [
  {
    title: "Send a photo",
    text: "Send the cake you want to the studio on WhatsApp. A picture from Instagram, Pinterest or your phone all work. A clear shot of the whole cake is best.",
  },
  {
    title: "Get a price from her list",
    text: "The photo is read for size, finish and decorations, and priced from Aminat's own list below. Anything her list does not cover is flagged, not guessed.",
  },
  {
    title: "Aminat confirms",
    text: "She checks the flagged parts, changes anything that needs it, and approves. You pay the deposit to book your date. Nothing is final before she says so.",
  },
];

// Three steps, and it really is a sequence.
export default function HowItWorks() {
  return (
    <section id="how" className={styles.section} aria-labelledby="how-title">
      <h2 id="how-title">How it works</h2>
      <ol className={styles.steps}>
        {STEPS.map((s, i) => (
          <li key={s.title} className={styles.step}>
            <span className={styles.n} aria-hidden="true">{i + 1}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

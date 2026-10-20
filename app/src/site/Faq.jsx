import { useMemo } from "react";
import { describeRateCard } from "../lib/describeRates";
import { useRateCard } from "./data";
import styles from "./Faq.module.css";

// The answers that quote numbers (deposit, notice, delivery areas) read them from the live price list.
export default function Faq() {
  const { data: card } = useRateCard();
  const d = useMemo(() => (card ? describeRateCard(card) : null), [card]);

  const items = [
    {
      q: "Is the price in the chat final?",
      a: "No. It is a price worked out from your photo and Aminat's list. She checks it, changes anything that needs it, and approves it. Until she does, nothing is final.",
    },
    d?.depositPercent != null && {
      q: "How much is the deposit?",
      a: `${d.depositPercent}% of the total, paid to confirm your order. The rest is paid before delivery.`,
    },
    d?.noticeDays != null && {
      q: "How much notice do you need?",
      a: `${d.noticeDays} days. If your date is sooner, Aminat has to check she has room first${d.rush ? `, and a rush charge applies: ${d.rush.charAt(0).toLowerCase()}${d.rush.slice(1)}` : "."}`,
    },
    {
      q: "What if my cake has something that is not on the price list?",
      a: "It gets flagged for Aminat, not guessed. A size or a decoration the list does not name is priced by her, and you will see that in the quote.",
    },
    d?.delivery?.length > 0 && {
      q: "Do you deliver?",
      a: `Yes, priced by area: ${d.delivery.map((x) => `${x.area.toLowerCase()} ${x.price}`).join(", ")}. It is added to the quote on top of the cake.`,
    },
    {
      q: "What should I send?",
      a: "A photo of the cake you want. A clear picture of the whole cake works best. If you send several, you will be asked which one to price.",
    },
  ].filter(Boolean);

  return (
    <section id="questions" className={styles.section} aria-labelledby="faq-title">
      <h2 id="faq-title">Questions</h2>
      <div className={styles.list}>
        {items.map((it) => (
          <details key={it.q} className={styles.item}>
            <summary>{it.q}</summary>
            <p>{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

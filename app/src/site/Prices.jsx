import { useMemo } from "react";
import { describeRateCard } from "../lib/describeRates";
import { useRateCard } from "./data";
import styles from "./Prices.module.css";

// Every figure on this section is read from the live RateCard record, formatted by describeRateCard.
export function Skeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <span /><span /><span /><span /><span />
    </div>
  );
}

function Group({ title, children, note }) {
  return (
    <section className={styles.group}>
      <h3>{title}</h3>
      {note && <p className={styles.note}>{note}</p>}
      <dl className={styles.list}>{children}</dl>
    </section>
  );
}

const Item = ({ name, price, per }) => (
  <div className={styles.item}>
    <dt>{name}{per ? <span className={styles.per}> {per}</span> : null}</dt>
    <dd>{price}</dd>
  </div>
);

export default function Prices() {
  const { status, data: card, retry } = useRateCard();
  const d = useMemo(() => (card ? describeRateCard(card) : null), [card]);
  return <PricesView status={status} d={d} retry={retry} />;
}

// The view alone, so it can be rendered with any data (the break harness does).
export function PricesView({ status, d, retry }) {
  // Cake boards drawn to scale: the diameter is the price list's own number of inches.
  const biggest = d ? Math.max(...d.sizes.map((s) => s.inches)) : 10;

  return (
    <section id="prices" className={styles.section} aria-labelledby="prices-title">
      <h2 id="prices-title">Prices</h2>
      <p className={styles.intro}>
        Every quote is worked out from this list, nothing else. These are sample prices for the sample studio.
      </p>

      {status === "loading" && !d && <Skeleton />}
      {status === "error" && (
        <div role="alert" className={styles.problem}>
          <p>The prices did not load.</p>
          <button type="button" onClick={retry}>Try again</button>
        </div>
      )}
      {status === "ready" && !d && <p className={styles.problem}>The price list has not been set up yet.</p>}

      {d && (
        <>
          <ul className={styles.sizes} aria-label="Cake sizes">
            {d.sizes.map((s) => (
              <li key={s.inches} className={styles.size}>
                <span className={styles.board} style={{ "--ratio": s.inches / biggest }} aria-hidden="true" />
                <span className={styles.inches}>{s.inches}"</span>
                <span className={styles.sizePrice}>{s.price}</span>
              </li>
            ))}
          </ul>

          <div className={styles.groups}>
            {(d.finishes.length > 0 || d.tall) && (
              <Group title="Finish and height">
                {d.finishes.map((f) => <Item key={f.name} {...f} name={`${f.name} covering`} />)}
                {d.tall && <Item name="Tall cake" price={d.tall} />}
              </Group>
            )}
            {d.flavours.length > 0 && (
              <Group title="Flavours">
                {d.flavours.map((f) => <Item key={f.name} {...f} />)}
              </Group>
            )}
            {d.decorations.length > 0 && (
              <Group title="Decorations" note="A range means Aminat picks the amount once she has seen the design.">
                {d.decorations.map((x) => <Item key={x.name} {...x} />)}
              </Group>
            )}
            {d.delivery.length > 0 && (
              <Group title="Delivery" note="Delivery is worked out separately from the cake.">
                {d.delivery.map((x) => <Item key={x.area} name={x.area} price={x.price} />)}
              </Group>
            )}
          </div>

          {d.rush && <p className={styles.rule}><strong>Rush orders.</strong> {d.rush}</p>}
        </>
      )}
    </section>
  );
}

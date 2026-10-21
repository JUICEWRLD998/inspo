import { useProfile } from "./StudioProfile";
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
  const { baker } = useProfile();
  const d = useMemo(() => (card ? describeRateCard(card, { baker }) : null), [card, baker]);
  return <PricesView status={status} d={d} retry={retry} />;
}

// The view alone, so it can be rendered with any data (the break harness does).
export function PricesView({ status, d, retry }) {
  const { baker, sample } = useProfile();

  return (
    <section id="prices" className={styles.section} aria-labelledby="prices-title">
      <h2 id="prices-title">Prices</h2>
      <p className={styles.intro}>
        Every quote is worked out from this list, nothing else.{sample && " These are sample prices for the sample studio."}
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
          <div className={styles.groups}>
            <Group title="Cake sizes">
              {d.sizes.map((x) => <Item key={x.inches} name={`${x.inches}"`} price={x.price} />)}
            </Group>
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
              <Group title="Decorations" note={`A range means ${baker} picks the amount once the design has been seen.`}>
                {d.decorations.map((x) => <Item key={x.name} {...x} />)}
              </Group>
            )}
            {d.delivery.length > 0 && (
              <Group title="Delivery" note="Worked out separately from the cake.">
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

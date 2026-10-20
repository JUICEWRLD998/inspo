import { useEffect, useState } from "react";
import { studioApi, useStudio } from "../api/studio";
import { DECORATION_TYPES, FINISHES, fromForm, toForm } from "../lib/rates";
import { Badge, Button, Field } from "../components/ui";
import styles from "./Rates.module.css";

const label = (s) => s.replace(/_/g, " ");

function Rows({ title, hint, rows, onChange, blank, children }) {
  const set = (i, patch) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <fieldset className={styles.group}>
      <legend>{title}</legend>
      {hint && <p className={styles.hint}>{hint}</p>}
      <div className={styles.rows}>
        {rows.map((r, i) => (
          <div className={styles.row} key={i}>
            {children(r, (patch) => set(i, patch), i)}
            <button type="button" className={styles.remove} aria-label={`Remove row ${i + 1} of ${title}`} onClick={() => onChange(rows.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
      </div>
      <Button variant="quiet" type="button" onClick={() => onChange([...rows, blank])}>Add a row</Button>
    </fieldset>
  );
}

export default function Rates() {
  const { rateCard, reload } = useStudio();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState([]);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (rateCard) setForm(toForm(rateCard));
  }, [rateCard]);

  if (!rateCard) return <p>There is no rate card yet.</p>;
  if (!form) return null;
  const patch = (p) => {
    setForm({ ...form, ...p });
    setSaved(false);
  };

  async function save(e) {
    e.preventDefault();
    const { card, errors: errs } = fromForm(form);
    setErrors(errs);
    if (!card) return;
    setBusy(true);
    try {
      await studioApi.updateRateCard(rateCard.id, card);
      await reload();
      setSaved(true);
    } catch (err) {
      setErrors([`Could not save: ${err.message ?? err}`]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className={styles.form} noValidate>
      <div className={styles.heading}>
        <h1>Rates</h1>
        {rateCard.data_origin === "sample" && <Badge tone="check">Sample data</Badge>}
      </div>
      <p className={styles.hint}>
        Every quote is priced from this list, in {rateCard.currency}. Type prices in naira. Nothing here is guessed by the AI.
      </p>

      <Rows title="Cake sizes" rows={form.tiers} onChange={(tiers) => patch({ tiers })} blank={{ diameter: "", price: "" }}>
        {(r, set) => (
          <>
            <Field label="Inches"><input inputMode="decimal" value={r.diameter} onChange={(e) => set({ diameter: e.target.value })} /></Field>
            <Field label="Price"><input inputMode="decimal" value={r.price} onChange={(e) => set({ price: e.target.value })} /></Field>
          </>
        )}
      </Rows>

      <Rows title="Finish" hint="The extra for each covering. Buttercream is usually 0." rows={form.finishes} onChange={(finishes) => patch({ finishes })} blank={{ key: "fondant", price: "" }}>
        {(r, set) => (
          <>
            <Field label="Finish">
              <select value={r.key} onChange={(e) => set({ key: e.target.value })}>
                {FINISHES.map((f) => <option key={f} value={f}>{label(f)}</option>)}
              </select>
            </Field>
            <Field label="Extra"><input inputMode="decimal" value={r.price} onChange={(e) => set({ price: e.target.value })} /></Field>
          </>
        )}
      </Rows>

      <fieldset className={styles.group}>
        <legend>Tall cake</legend>
        <Field label="Extra for a tall tier"><input inputMode="decimal" value={form.tall} onChange={(e) => patch({ tall: e.target.value })} /></Field>
      </fieldset>

      <Rows title="Flavours" hint="The customer is offered exactly these. Use 0 for included." rows={form.flavours} onChange={(flavours) => patch({ flavours })} blank={{ key: "", price: "0" }}>
        {(r, set) => (
          <>
            <Field label="Flavour"><input value={r.key} onChange={(e) => set({ key: e.target.value })} /></Field>
            <Field label="Extra"><input inputMode="decimal" value={r.price} onChange={(e) => set({ price: e.target.value })} /></Field>
          </>
        )}
      </Rows>

      <Rows title="Decorations" hint="'Each' charges per piece. 'Once' charges one price however many. Fill the top price for a range; you will pick the amount on each quote." rows={form.decorations} onChange={(decorations) => patch({ decorations })} blank={{ type: "topper", unit: "each", price: "", max: "" }}>
        {(r, set) => (
          <>
            <Field label="Type">
              <select value={r.type} onChange={(e) => set({ type: e.target.value })}>
                {DECORATION_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}
              </select>
            </Field>
            <Field label="Charged">
              <select value={r.unit} onChange={(e) => set({ unit: e.target.value })}>
                <option value="each">each</option>
                <option value="flat">once</option>
              </select>
            </Field>
            <Field label="Price"><input inputMode="decimal" value={r.price} onChange={(e) => set({ price: e.target.value })} /></Field>
            <Field label="Top price"><input inputMode="decimal" placeholder="optional" value={r.max} onChange={(e) => set({ max: e.target.value })} /></Field>
          </>
        )}
      </Rows>

      <fieldset className={styles.group}>
        <legend>Rush orders</legend>
        <div className={styles.row}>
          <Field label="Surcharge %" hint="Leave empty for no rush surcharge"><input inputMode="numeric" value={form.rushPercent} onChange={(e) => patch({ rushPercent: e.target.value })} /></Field>
          <Field label="When the event is within (days)"><input inputMode="decimal" value={form.rushWithinDays} onChange={(e) => patch({ rushWithinDays: e.target.value })} /></Field>
        </div>
      </fieldset>

      <Rows title="Delivery" hint="From-prices by area. A customer who wants delivery picks one." rows={form.zones} onChange={(zones) => patch({ zones })} blank={{ key: "", price: "" }}>
        {(r, set) => (
          <>
            <Field label="Area"><input value={r.key} onChange={(e) => set({ key: e.target.value })} /></Field>
            <Field label="From"><input inputMode="decimal" value={r.price} onChange={(e) => set({ price: e.target.value })} /></Field>
          </>
        )}
      </Rows>

      <fieldset className={styles.group}>
        <legend>Rules</legend>
        <div className={styles.row}>
          <Field label="Deposit %"><input inputMode="numeric" value={form.depositPercent} onChange={(e) => patch({ depositPercent: e.target.value })} /></Field>
          <Field label="Minimum notice (days)"><input inputMode="numeric" value={form.leadDays} onChange={(e) => patch({ leadDays: e.target.value })} /></Field>
        </div>
      </fieldset>

      {errors.length > 0 && (
        <ul role="alert" className={styles.errors}>{errors.map((e) => <li key={e}>{e}</li>)}</ul>
      )}
      <div className={styles.bar}>
        <Button type="submit" busy={busy}>Save rates</Button>
        <span role="status" className={styles.saved}>{saved ? "Saved. New quotes use these prices." : ""}</span>
      </div>
    </form>
  );
}

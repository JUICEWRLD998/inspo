import { useEffect, useState } from "react";
import { studioApi, useStudio } from "../api/studio";
import { Badge, Button, Field } from "../components/ui";
import styles from "./Settings.module.css";

const FIELDS = [
  { key: "brand", label: "Business name", hint: "Shown at the top of this desk and in messages to customers." },
  { key: "name", label: "Your name" },
  { key: "city", label: "City" },
  { key: "whatsapp_display", label: "WhatsApp number customers message", hint: "Display only. The agent's number is set in Base44." },
];

export default function Settings() {
  const { maker, user, reload } = useStudio();
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState({ busy: false, error: "", saved: false });

  useEffect(() => {
    if (maker) setForm({ ...Object.fromEntries(FIELDS.map((f) => [f.key, maker[f.key] ?? ""])), bank_or_payment_note: maker.bank_or_payment_note ?? "" });
  }, [maker]);

  if (!maker) return <p>No maker record yet.</p>;
  if (!form) return null;

  async function save(e) {
    e.preventDefault();
    if (!form.brand.trim() || !form.name.trim()) {
      setStatus({ busy: false, saved: false, error: "Business name and your name can't be empty." });
      return;
    }
    setStatus({ busy: true, error: "", saved: false });
    try {
      await studioApi.updateMaker(maker.id, form);
      await reload();
      setStatus({ busy: false, error: "", saved: true });
    } catch (err) {
      setStatus({ busy: false, saved: false, error: `Could not save: ${err.message ?? err}` });
    }
  }

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setStatus({ ...status, saved: false });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.heading}>
        <h1>Settings</h1>
        {maker.data_origin === "sample" && <Badge tone="check">Sample data</Badge>}
      </div>
      {maker.data_origin === "sample" && (
        <p className={styles.note}>
          This studio is sample data, invented for testing. It is not a real business. Replace it with the real maker's details before any real customer uses it.
        </p>
      )}
      <form onSubmit={save} className={styles.form} noValidate>
        {FIELDS.map((f) => (
          <Field key={f.key} label={f.label} hint={f.hint}>
            <input value={form[f.key]} onChange={set(f.key)} />
          </Field>
        ))}
        <Field label="Payment note" hint="Added to the message you send when you approve a quote, for example your account details.">
          <textarea rows={4} value={form.bank_or_payment_note} onChange={set("bank_or_payment_note")} />
        </Field>
        {status.error && <p role="alert" className={styles.error}>{status.error}</p>}
        <div className={styles.bar}>
          <Button type="submit" busy={status.busy}>Save</Button>
          <span role="status" className={styles.saved}>{status.saved ? "Saved" : ""}</span>
        </div>
      </form>

      <section className={styles.account} aria-label="Account">
        <h2>Account</h2>
        <p>Signed in as <strong>{user?.email}</strong></p>
        <Button variant="quiet" onClick={studioApi.logout}>Sign out</Button>
      </section>
    </div>
  );
}

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { studioApi, useStudio } from "../api/studio";
import { addLine, canApprove, customerMessage, editLine, removeLine, verifyAgainstEngine, waLink } from "../lib/quotes";
import { explainCheck } from "../lib/checks";
import { currencySymbol, toMajorString, toMinor } from "../lib/money";
import { display } from "../../base44/functions/priceQuote/pricing.js";
import { Badge, Button } from "../components/ui";
import styles from "./QuoteDetail.module.css";

const PRICE_HELP = "Enter a price like 42000 or 42,000.50";
const dateLabel = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "No date yet";

function PriceInput({ value, disabled, onCommit, label, symbol }) {
  const [text, setText] = useState(toMajorString(value));
  const [bad, setBad] = useState(false);
  const commit = () => {
    const minor = toMinor(text);
    if (minor === null) {
      setBad(true);
      return;
    }
    setBad(false);
    if (minor !== value) onCommit(minor);
    else setText(toMajorString(value));
  };
  return (
    <span className={styles.priceWrap}>
      <span className={styles.cur} aria-hidden="true">{symbol}</span>
    <input
      className={`${styles.price} ${bad ? styles.bad : ""}`}
      inputMode="decimal"
      aria-label={label}
      aria-invalid={bad || undefined}
      title={bad ? PRICE_HELP : undefined}
      value={text}
      disabled={disabled}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
    />
    </span>
  );
}

export default function QuoteDetail({ quote: initial, customer, onChanged }) {
  const { maker, rateCard } = useStudio();
  const [quote, setQuote] = useState(initial);
  const [ack, setAck] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [copied, setCopied] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [extra, setExtra] = useState({ label: "", price: "" });

  const locked = quote.status !== "pending_approval";
  const cur = quote.currency;
  const verdict = canApprove(quote, ack);
  const engine = useMemo(
    () => (rateCard ? verifyAgainstEngine(initial, rateCard, { now: initial.created_date }) : { checked: false }),
    [initial, rateCard],
  );
  const brand = maker?.brand ?? "the studio";
  // One source of truth for the deposit: the rate card, the same one the agent and the pricing engine use.
  const depositPercent = rateCard?.deposit_percent ?? 0;
  const message = customerMessage(quote, { brand, depositPercent, paymentNote: maker?.bank_or_payment_note });
  const link = waLink(customer?.whatsapp_id, message);

  async function edit(fn) {
    setError("");
    let next;
    try {
      next = fn(quote);
    } catch (e) {
      setError(e.message);
      return;
    }
    const before = quote;
    setQuote(next);
    try {
      await studioApi.saveQuoteEdits(next);
      onChanged?.();
    } catch (e) {
      setQuote(before);
      setError(`Could not save that change: ${e.message ?? e}`);
    }
  }

  async function onApprove() {
    setBusy(true);
    setError("");
    try {
      const res = await studioApi.approveQuote(quote, { depositPercent, now: new Date().toISOString() });
      setQuote(res.quote);
      setDone(res.order);
      onChanged?.();
    } catch (e) {
      setError(`Could not approve: ${e.message ?? e}`);
    } finally {
      setBusy(false);
    }
  }

  async function onDecline() {
    if (!confirmDecline) {
      setConfirmDecline(true);
      return;
    }
    setBusy(true);
    try {
      await studioApi.declineQuote(quote.id, new Date().toISOString());
      setQuote({ ...quote, status: "declined" });
      onChanged?.();
    } catch (e) {
      setError(`Could not decline: ${e.message ?? e}`);
    } finally {
      setBusy(false);
      setConfirmDecline(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy is blocked in this browser. Select the message text instead.");
    }
  }

  const addExtra = () => {
    const minor = toMinor(extra.price);
    if (!extra.label.trim() || minor === null) {
      setError(`Give the extra a name and a price. ${PRICE_HELP}`);
      return;
    }
    edit((q) => addLine(q, { label: extra.label, unit_price: minor }, new Date().toISOString()));
    setExtra({ label: "", price: "" });
  };

  return (
    <article className={styles.detail}>
      <div className={styles.photoWrap}>
        {quote.image_url && !photoFailed ? (
          <img className={styles.photo} src={quote.image_url} alt="The cake the customer wants" onError={() => setPhotoFailed(true)} />
        ) : (
          <p className={styles.noPhoto}>{quote.image_url ? "This photo link has expired." : "No photo was saved with this quote."}</p>
        )}
      </div>

      <div className={styles.body}>
        <header className={styles.head}>
          <div>
            <h2>{customer?.name ?? (customer ? `+${customer.whatsapp_id}` : "Customer not linked")}</h2>
            <p className={styles.meta}>
              For {dateLabel(quote.event_date)}
              {quote.servings ? ` · about ${quote.servings} servings` : ""}
              {quote.delivery ? ` · delivery: ${quote.delivery}` : " · pickup"}
            </p>
          </div>
          <Badge tone={quote.status === "sent" ? "ok" : quote.status === "declined" ? "neutral" : "check"}>
            {quote.status === "pending_approval" ? "Waiting for you" : quote.status === "sent" ? "Approved" : quote.status}
          </Badge>
        </header>

        {engine.checked && !engine.matches && (
          <p role="alert" className={styles.warn}>
            This total does not match your price list for these features. Your list gives {display(engine.expected, cur)}, the quote says{" "}
            {display(quote.total, cur)}. Review the lines before approving.
          </p>
        )}

        {quote.needs_check?.length > 0 && (
          <section aria-labelledby="checks">
            <h3 id="checks" className={styles.sub}>{locked ? "Flagged" : "Check these first"}</h3>
            <ul className={styles.checks}>
              {quote.needs_check.map((f) => {
                const on = ack.includes(f) || locked;
                return (
                  <li key={f}>
                    <button
                      type="button"
                      className={`${styles.check} ${on ? styles.checked : ""}`}
                      aria-pressed={on}
                      disabled={locked}
                      onClick={() => setAck((a) => (a.includes(f) ? a.filter((x) => x !== f) : [...a, f]))}
                    >
                      <span aria-hidden="true" className={styles.box}>{on ? "✓" : ""}</span>
                      {explainCheck(f)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section aria-labelledby="lines">
          <h3 id="lines" className={styles.sub}>Price</h3>
          <ul className={styles.lines}>
            <AnimatePresence initial={false}>
              {quote.line_items.map((l, i) => (
                <motion.li
                  key={`${l.label}-${i}`}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className={styles.line}
                >
                  <div className={styles.lineText}>
                    <span>{l.label}{l.qty > 1 ? ` × ${l.qty}` : ""}</span>
                    {l.note && <small>{l.note}</small>}
                  </div>
                  <PriceInput
                    key={l.unit_price}
                    value={l.unit_price}
                    disabled={locked}
                    label={`Price for ${l.label}`}
                    symbol={currencySymbol(cur)}
                    onCommit={(v) => edit((q) => editLine(q, i, { unit_price: v }, new Date().toISOString()))}
                  />
                  {!locked && quote.line_items.length > 1 && (
                    <button type="button" className={styles.remove} aria-label={`Remove ${l.label}`} onClick={() => edit((q) => removeLine(q, i, new Date().toISOString()))}>
                      ×
                    </button>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {!locked && (
            <div className={styles.add}>
              <input aria-label="Extra item name" placeholder="Extra item" value={extra.label} onChange={(e) => setExtra({ ...extra, label: e.target.value })} />
              <input aria-label="Extra item price" placeholder={`Price (${currencySymbol(cur)})`} inputMode="decimal" value={extra.price} onChange={(e) => setExtra({ ...extra, price: e.target.value })} />
              <Button variant="quiet" type="button" onClick={addExtra}>Add</Button>
            </div>
          )}

          <dl className={styles.totals}>
            <div><dt>Total</dt><dd aria-live="polite">{display(quote.total, cur)}</dd></div>
            {depositPercent > 0 && <div><dt>{depositPercent}% deposit</dt><dd>{display(Math.round((quote.total * depositPercent) / 100), cur)}</dd></div>}
          </dl>
          {quote.edit_log?.length > 0 && <p className={styles.log}>{quote.edit_log.length} edit{quote.edit_log.length > 1 ? "s" : ""} by you are saved on this quote.</p>}
        </section>

        {error && <p role="alert" className={styles.error}>{error}</p>}

        {!locked && (
          <div className={styles.actions}>
            <Button busy={busy} disabled={!verdict.ok} onClick={onApprove}>Approve {display(quote.total, cur)}</Button>
            <Button variant="danger" disabled={busy} onClick={onDecline}>{confirmDecline ? "Tap again to decline" : "Decline"}</Button>
            {!verdict.ok && <p className={styles.why}>{verdict.reasons[0]}</p>}
          </div>
        )}

        <AnimatePresence>
          {quote.status === "sent" && (
            <motion.section
              key="sent"
              className={styles.sent}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              aria-labelledby="sent-h"
            >
              <h3 id="sent-h">{done ? "Approved. The order is on your calendar." : "Approved"}</h3>
              <p className={styles.preview}>{message}</p>
              <div className={styles.actions}>
                {link ? (
                  <a className={styles.wa} href={link} target="_blank" rel="noreferrer">Send on WhatsApp</a>
                ) : (
                  <p className={styles.why}>No phone number is linked to this customer, so copy the message instead.</p>
                )}
                <Button variant="quiet" onClick={copy}>{copied ? "Copied" : "Copy message"}</Button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}

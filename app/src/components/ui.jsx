import styles from "./ui.module.css";

export function Button({ variant = "primary", busy = false, className = "", children, ...rest }) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${className}`}
      aria-busy={busy || undefined}
      disabled={rest.disabled || busy}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Badge({ tone = "neutral", children }) {
  return <span className={`${styles.badge} ${styles[`tone_${tone}`]}`}>{children}</span>;
}

export function Field({ label, hint, children }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  );
}

export function Empty({ title, children }) {
  return (
    <div className={styles.empty}>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

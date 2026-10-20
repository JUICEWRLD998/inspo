// Inputs are typed in major units (naira); storage is whole minor units (kobo).
// Parse the string by hand: multiplying a float by 100 gives 0.29 * 100 = 28.999999999999996.
export function toMinor(input, { allowZero = false } = {}) {
  if (typeof input !== "string") return null;
  const cleaned = input.replace(/[₦$£€,\s]/g, "");
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!m) return null;
  const minor = Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0") || 0);
  return minor > 0 || (allowZero && minor === 0) ? minor : null;
}

export function toMajorString(minor) {
  if (!Number.isInteger(minor)) return "";
  const whole = Math.floor(minor / 100);
  const frac = minor % 100;
  return frac === 0 ? String(whole) : `${whole}.${String(frac).padStart(2, "0")}`;
}

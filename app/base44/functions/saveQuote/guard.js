// Intake guards for the two functions an anonymous caller can reach (saveQuote, extractFeatures).
// Measured 2026-10-21: both answer an unauthenticated POST, so they must refuse bad input themselves.
// extractFeatures/guard.js is a byte-identical copy (a function only deploys files inside its own folder); a test pins it.
const PHOTO_HOST = "media.base44.com"; // where WhatsApp photo links live (VERIFIED from stored Quote.image_url values)
export const FLOOD_LIMIT = 30; // quotes per rolling hour; a real studio gets a handful
const MAX_FEATURES_BYTES = 50_000;

export function checkImageUrl(value) {
  if (typeof value !== "string") return { ok: false, reason: "image_url must be a string" };
  let u;
  try {
    u = new URL(value);
  } catch {
    return { ok: false, reason: "image_url is not a valid URL" };
  }
  if (u.protocol !== "https:") return { ok: false, reason: "image_url must be https" };
  if (u.username || u.password || u.port) return { ok: false, reason: "image_url must not carry credentials or a port" };
  if (u.hostname !== PHOTO_HOST) return { ok: false, reason: "image_url must be a WhatsApp photo link" };
  return { ok: true };
}

export function checkQuoteInput(body) {
  const errors = [];
  const b = body ?? {};
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  if (!isObj(b.features)) errors.push("features must be an object");
  else if (JSON.stringify(b.features).length > MAX_FEATURES_BYTES) errors.push("features is too large");
  if (b.image_url !== undefined && b.image_url !== null && !checkImageUrl(b.image_url).ok) errors.push("image_url must be a WhatsApp photo link");
  if (typeof b.rate_card_id !== "string" || !b.rate_card_id) errors.push("rate_card_id must be a string");
  if (b.event_date != null && (typeof b.event_date !== "string" || Number.isNaN(Date.parse(b.event_date)))) errors.push("event_date must be an ISO date");
  if (b.flavour != null && typeof b.flavour !== "string") errors.push("flavour must be a string");
  if (b.delivery != null && typeof b.delivery !== "string" && typeof b.delivery !== "boolean") errors.push("delivery must be a zone key or false");
  return { ok: errors.length === 0, errors };
}

export function tooManyRecent(quotes, nowMs) {
  return quotes.filter((q) => nowMs - Date.parse(q.created_date) <= 3_600_000).length >= FLOOD_LIMIT;
}

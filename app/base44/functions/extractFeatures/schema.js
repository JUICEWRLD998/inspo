// The only thing the vision model may return. No prices, ever.
export const FEATURE_SCHEMA = {
  type: "object",
  properties: {
    tiers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          diameter_in: { type: "number", description: "Estimated diameter in inches" },
          height: { type: "string", enum: ["standard", "tall"] },
          confidence: { type: "number", description: "0 to 1" },
        },
        required: ["diameter_in", "height", "confidence"],
      },
    },
    shape: { type: "string", enum: ["round", "square", "heart", "sheet", "number", "other"] },
    finish: { type: "string", enum: ["buttercream", "fondant", "semi_naked", "ganache", "other"] },
    decorations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["sugar_flowers", "fresh_flowers", "gold_drip", "drip", "topper", "figurine", "edible_print", "piping", "macarons", "other"],
          },
          quantity: { type: "integer" },
          size: { type: "string", enum: ["small", "medium", "large"] },
          confidence: { type: "number", description: "0 to 1" },
        },
        required: ["type", "quantity", "size", "confidence"],
      },
    },
    text_on_cake: { type: ["string", "null"] },
    colours: { type: "array", items: { type: "string" } },
    servings_estimate: { type: "integer" },
    unreadable: { type: "boolean", description: "true if the image is not a cake or cannot be read" },
    notes: { type: "string" },
  },
  required: ["tiers", "shape", "finish", "decorations", "colours", "unreadable"],
};

const clamp01 = (n) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

// Never trust the model's shape: coerce, clamp, and drop anything extra (a stray "price" key included).
export function normalise(raw) {
  if (!raw || typeof raw !== "object" || raw.unreadable === true) return { unreadable: true, notes: raw?.notes ?? "" };
  return {
    tiers: (raw.tiers ?? []).map((t) => ({
      diameter_in: Number(t.diameter_in),
      height: t.height === "tall" ? "tall" : "standard",
      confidence: clamp01(t.confidence),
    })),
    shape: raw.shape ?? "other",
    finish: raw.finish ?? "other",
    decorations: (raw.decorations ?? []).map((d) => ({
      type: d.type ?? "other",
      quantity: Math.max(1, Math.round(Number(d.quantity) || 1)),
      size: d.size ?? "small",
      confidence: clamp01(d.confidence),
    })),
    text_on_cake: raw.text_on_cake ?? null,
    colours: (raw.colours ?? []).map(String),
    servings_estimate: Math.max(0, Math.round(Number(raw.servings_estimate) || 0)),
    unreadable: false,
    notes: String(raw.notes ?? ""),
  };
}

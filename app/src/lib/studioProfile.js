// What the public site says about the studio, derived from the Maker record so a real maker never sees "Aminat".
// Until the record loads (or if it cannot) the copy stays neutral rather than guessing a name.
const clean = (s) => String(s ?? "").replace(/\s*\((sample|sample data)\)\s*/gi, " ").replace(/\s+/g, " ").trim();

export function studioProfile(maker) {
  if (!maker) return { loaded: false, brand: "Inspo", baker: "the baker", possessive: "the baker's", sample: false, showDemo: false };
  const brand = clean(maker.brand) || "Inspo";
  const first = clean(maker.name).split(" ")[0];
  const baker = first || "the baker";
  const sample = maker.data_origin === "sample";
  return {
    loaded: true,
    brand,
    baker,
    possessive: first ? `${first}'s` : "the baker's",
    sample,
    // The captured demo quote and photo belong to the sample studio. A real studio shows none until it has its own.
    showDemo: sample,
  };
}

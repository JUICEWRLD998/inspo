import { describe, it, expect } from "vitest";
import { studioProfile } from "../src/lib/studioProfile.js";

describe("studioProfile", () => {
  it("is neutral until a maker record has loaded", () => {
    expect(studioProfile(null)).toMatchObject({ loaded: false, brand: "Inspo", baker: "the baker", sample: false, showDemo: false });
  });

  it("marks a sample studio, strips the sample suffixes, and shows the demo", () => {
    const p = studioProfile({ brand: "Aminat's Cake Studio (sample data)", name: "Aminat Bello (sample)", data_origin: "sample" });
    expect(p).toMatchObject({ loaded: true, brand: "Aminat's Cake Studio", baker: "Aminat", possessive: "Aminat's", sample: true, showDemo: true });
  });

  it("uses a real maker's own words and hides the sample demo", () => {
    const p = studioProfile({ brand: "Crumb & Co", name: "Tolu Adeyemi", data_origin: "real" });
    expect(p).toMatchObject({ brand: "Crumb & Co", baker: "Tolu", possessive: "Tolu's", sample: false, showDemo: false });
  });

  it("does not call a record with no origin sample", () => {
    expect(studioProfile({ brand: "X", name: "Y Z" }).sample).toBe(false);
  });
});

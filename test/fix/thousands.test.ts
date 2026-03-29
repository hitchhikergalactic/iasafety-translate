import { describe, it, expect } from "vitest";
import { insertThousandsSeparators } from "../../src/fix/thousands.js";

describe("insertThousandsSeparators", () => {
  it("inserts comma for English", () => {
    expect(insertThousandsSeparators("about 1000000 people", "en"))
      .toBe("about 1,000,000 people");
  });
  it("inserts period for German", () => {
    expect(insertThousandsSeparators("etwa 1000000 Menschen", "de"))
      .toBe("etwa 1.000.000 Menschen");
  });
  it("inserts narrow no-break space for French", () => {
    expect(insertThousandsSeparators("environ 1000000 personnes", "fr"))
      .toContain("\u202F");
  });
  it("does not modify 4-digit years in isolation", () => {
    expect(insertThousandsSeparators("in 2024 there were", "en"))
      .toBe("in 2,024 there were");
  });
  it("does not modify numbers inside URLs", () => {
    expect(insertThousandsSeparators("see https://example.com/12345", "en"))
      .toBe("see https://example.com/12345");
  });
  it("does not modify numbers inside Math tags", () => {
    expect(insertThousandsSeparators("<Math>10000</Math>", "en"))
      .toBe("<Math>10000</Math>");
  });
  it("leaves small numbers alone", () => {
    expect(insertThousandsSeparators("only 999 items", "en"))
      .toBe("only 999 items");
  });
});

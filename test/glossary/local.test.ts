import { describe, it, expect } from "vitest";
import {
  parseGlossary,
  getTermsForLanguage,
  getMissingTerms,
  formatGlossaryForDeepL,
} from "../../src/glossary/local.js";

const SAMPLE_GLOSSARY = [
  { en: "existential risk", es: "riesgo existencial", fr: "risque existentiel", type: "variable" },
  { en: "effective altruism", es: "altruismo eficaz", type: "variable" },
  { en: "longtermism", es: "", fr: "", type: "variable" },
];

describe("parseGlossary", () => {
  it("parses JSON array", () => {
    const glossary = parseGlossary(JSON.stringify(SAMPLE_GLOSSARY));
    expect(glossary).toHaveLength(3);
    expect(glossary[0].en).toBe("existential risk");
  });
});

describe("getTermsForLanguage", () => {
  it("returns entries that have a translation for the given language", () => {
    const terms = getTermsForLanguage(SAMPLE_GLOSSARY, "fr");
    expect(terms).toHaveLength(1);
    expect(terms[0].en).toBe("existential risk");
  });
  it("returns all entries for Spanish", () => {
    const terms = getTermsForLanguage(SAMPLE_GLOSSARY, "es");
    expect(terms).toHaveLength(2);
  });
});

describe("getMissingTerms", () => {
  it("returns entries missing a translation for the given language", () => {
    const missing = getMissingTerms(SAMPLE_GLOSSARY, "fr");
    expect(missing).toHaveLength(2);
  });
});

describe("formatGlossaryForDeepL", () => {
  it("formats as TSV with source and target columns", () => {
    const tsv = formatGlossaryForDeepL(SAMPLE_GLOSSARY, "es");
    const lines = tsv.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("existential risk\triesgo existencial");
  });
});

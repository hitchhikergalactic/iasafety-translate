// test/glossary/ai.test.ts
import { describe, it, expect } from "vitest";
import { parseGeneratedTranslations, mergeTranslations, filterRelevantTerms } from "../../src/glossary/ai.js";

describe("parseGeneratedTranslations", () => {
  it("splits AI response into lines matching input count", () => {
    const response = "riesgo existencial\naltruismo eficaz\nlargoplazismo";
    const terms = ["existential risk", "effective altruism", "longtermism"];
    const result = parseGeneratedTranslations(response, terms);
    expect(result).toEqual([
      { en: "existential risk", translation: "riesgo existencial" },
      { en: "effective altruism", translation: "altruismo eficaz" },
      { en: "longtermism", translation: "largoplazismo" },
    ]);
  });

  it("handles fewer lines than terms by marking remaining as unavailable", () => {
    const response = "riesgo existencial\naltruismo eficaz";
    const terms = ["existential risk", "effective altruism", "longtermism"];
    const result = parseGeneratedTranslations(response, terms);
    expect(result).toHaveLength(3);
    expect(result[2].translation).toBe("[TRANSLATION_UNAVAILABLE]");
  });

  it("handles more lines than terms by truncating", () => {
    const response = "riesgo existencial\naltruismo eficaz\nextra line\nanother";
    const terms = ["existential risk", "effective altruism"];
    const result = parseGeneratedTranslations(response, terms);
    expect(result).toHaveLength(2);
  });

  it("trims whitespace from translations", () => {
    const response = "  riesgo existencial  \n  altruismo eficaz  ";
    const terms = ["existential risk", "effective altruism"];
    const result = parseGeneratedTranslations(response, terms);
    expect(result[0].translation).toBe("riesgo existencial");
  });
});

describe("mergeTranslations", () => {
  it("merges generated translations into existing glossary", () => {
    const glossary = [
      { en: "existential risk", es: "riesgo existencial", type: "variable" },
      { en: "longtermism", type: "variable" },
    ];
    const generated = [
      { en: "longtermism", translation: "largoplazismo" },
    ];
    const result = mergeTranslations(glossary, generated, "fr");
    expect(result[0].fr).toBeUndefined();
    expect(result[1].fr).toBe("largoplazismo");
  });

  it("skips unavailable translations", () => {
    const glossary = [{ en: "longtermism", type: "variable" }];
    const generated = [{ en: "longtermism", translation: "[TRANSLATION_UNAVAILABLE]" }];
    const result = mergeTranslations(glossary, generated, "fr");
    expect(result[0].fr).toBeUndefined();
  });
});

describe("filterRelevantTerms", () => {
  it("parses AI filter response into term list", () => {
    const response = "existential risk\nlongtermism";
    const result = filterRelevantTerms(response);
    expect(result).toEqual(["existential risk", "longtermism"]);
  });

  it("trims and removes empty lines", () => {
    const response = "  existential risk  \n\n  longtermism  \n";
    const result = filterRelevantTerms(response);
    expect(result).toEqual(["existential risk", "longtermism"]);
  });
});

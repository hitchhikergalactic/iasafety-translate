import { describe, it, expect } from "vitest";
import {
  applyLanguageFixes,
  fixCurlyQuotes,
  fixPeriodsInHeadings,
  fixPercentSigns,
  fixThinSpaces,
  fixSuperscripts,
  checkHeadingHierarchy,
  checkUnbalancedCharacters,
} from "../../src/fix/autofix.js";

describe("applyLanguageFixes (French)", () => {
  it("converts hyphens to em dashes in prose", () => {
    const result = applyLanguageFixes("texte - suite", "fr");
    expect(result).toContain("—");
  });
  it('converts straight quotes to guillemets', () => {
    const result = applyLanguageFixes('il dit "bonjour"', "fr");
    expect(result).toContain("«");
  });
  it("fixes 'type :' to 'type:'", () => {
    const result = applyLanguageFixes("type : valeur", "fr");
    expect(result).toContain("type:");
  });
  it("replaces <Note /> with <Footnote />", () => {
    const result = applyLanguageFixes("<Note />", "fr");
    expect(result).toBe("<Footnote />");
  });
});

describe("applyLanguageFixes (Italian)", () => {
  it("converts hyphens to em dashes", () => {
    const result = applyLanguageFixes("testo - seguito", "it");
    expect(result).toContain("—");
  });
  it("replaces <Nota /> with <Footnote />", () => {
    const result = applyLanguageFixes("<Nota />", "it");
    expect(result).toBe("<Footnote />");
  });
});

describe("applyLanguageFixes (no rules)", () => {
  it("returns text unchanged for languages without rules", () => {
    const text = "some text - here";
    expect(applyLanguageFixes(text, "de")).toBe(text);
  });
});

describe("fixCurlyQuotes", () => {
  it("leaves straight quotes alone", () => {
    expect(fixCurlyQuotes('"hello"')).toBe('"hello"');
  });
});

describe("fixPeriodsInHeadings", () => {
  it("removes trailing period from heading", () => {
    expect(fixPeriodsInHeadings("## Hello World.")).toBe("## Hello World");
  });
  it("leaves headings without period alone", () => {
    expect(fixPeriodsInHeadings("## Hello World")).toBe("## Hello World");
  });
  it("handles multiple headings", () => {
    const input = "## First.\n\nSome text.\n\n### Second.";
    const result = fixPeriodsInHeadings(input);
    expect(result).toBe("## First\n\nSome text.\n\n### Second");
  });
});

describe("fixPercentSigns", () => {
  it("adds non-breaking space before percent", () => {
    const result = fixPercentSigns("costs 50% more");
    expect(result).toMatch(/50\u202F%/);
  });
  it("leaves percent in quoted attributes alone", () => {
    const input = 'width="50%"';
    expect(fixPercentSigns(input)).toBe(input);
  });
});

describe("fixThinSpaces", () => {
  it("replaces thin spaces with narrow no-break spaces", () => {
    expect(fixThinSpaces("hello\u2009world")).toBe("hello\u202Fworld");
  });
});

describe("fixSuperscripts", () => {
  it("converts ^N^ to <sup>N</sup>", () => {
    expect(fixSuperscripts("10^2^")).toBe("10<sup>2</sup>");
  });
  it("handles multi-digit superscripts", () => {
    expect(fixSuperscripts("2^10^")).toBe("2<sup>10</sup>");
  });
});

describe("checkHeadingHierarchy", () => {
  it("returns no errors for valid hierarchy", () => {
    const text = "## H2\n\n### H3\n\n#### H4";
    expect(checkHeadingHierarchy(text)).toHaveLength(0);
  });
  it("detects skipped heading level", () => {
    const text = "## H2\n\n#### H4";
    const errors = checkHeadingHierarchy(text);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain("4");
  });
});

describe("checkUnbalancedCharacters", () => {
  it("returns no errors for balanced text", () => {
    expect(checkUnbalancedCharacters("(hello [world])")).toHaveLength(0);
  });
  it("detects missing closing bracket", () => {
    const errors = checkUnbalancedCharacters("(hello [world)");
    expect(errors.length).toBeGreaterThan(0);
  });
  it("detects missing opening bracket", () => {
    const errors = checkUnbalancedCharacters("hello)");
    expect(errors.length).toBeGreaterThan(0);
  });
  it("handles guillemets", () => {
    expect(checkUnbalancedCharacters("«hello»")).toHaveLength(0);
    expect(checkUnbalancedCharacters("«hello").length).toBeGreaterThan(0);
  });
});

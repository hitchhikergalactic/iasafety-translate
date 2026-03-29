import { describe, it, expect } from "vitest";
import {
  splitIntoParagraphs,
  alignParagraphs,
  formatParagraphPairs,
} from "../../src/revision/paragraphs.js";

describe("splitIntoParagraphs", () => {
  it("splits on double newlines", () => {
    expect(splitIntoParagraphs("para1\n\npara2\n\npara3"))
      .toEqual(["para1", "para2", "para3"]);
  });
  it("trims whitespace from paragraphs", () => {
    expect(splitIntoParagraphs("  para1  \n\n  para2  "))
      .toEqual(["para1", "para2"]);
  });
  it("filters out empty paragraphs", () => {
    expect(splitIntoParagraphs("para1\n\n\n\npara2"))
      .toEqual(["para1", "para2"]);
  });
  it("handles single paragraph", () => {
    expect(splitIntoParagraphs("just one")).toEqual(["just one"]);
  });
  it("strips code fences from response", () => {
    expect(splitIntoParagraphs("```markdown\ncontent\n```"))
      .toEqual(["content"]);
  });
  it("returns empty array for empty input", () => {
    expect(splitIntoParagraphs("")).toEqual([]);
  });
});

describe("alignParagraphs", () => {
  it("pairs source and translation paragraphs by index", () => {
    const pairs = alignParagraphs(["s1", "s2", "s3"], ["t1", "t2", "t3"]);
    expect(pairs).toEqual([
      { source: "s1", translation: "t1" },
      { source: "s2", translation: "t2" },
      { source: "s3", translation: "t3" },
    ]);
  });
  it("handles mismatched lengths by padding shorter", () => {
    const pairs = alignParagraphs(["s1", "s2"], ["t1"]);
    expect(pairs).toHaveLength(2);
    expect(pairs[1].translation).toBe("");
  });
});

describe("formatParagraphPairs", () => {
  it("formats pairs for prompt insertion", () => {
    const pairs = [{ source: "Hello world", translation: "Hola mundo" }];
    const formatted = formatParagraphPairs(pairs);
    expect(formatted).toContain("Hello world");
    expect(formatted).toContain("Hola mundo");
    expect(formatted).toContain("Original");
    expect(formatted).toContain("Translation");
  });
});

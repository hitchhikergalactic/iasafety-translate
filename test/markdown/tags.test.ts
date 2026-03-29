import { describe, it, expect } from "vitest";
import { MDX_TAGS, SSML_TAGS, HTML_TAGS, getTagList } from "../../src/markdown/tags.js";

describe("tag registry", () => {
  it("has MDX tags including Aside and Cite", () => {
    expect(MDX_TAGS).toContain("Aside");
    expect(MDX_TAGS).toContain("Cite");
    expect(MDX_TAGS).toContain("Footnote");
    expect(MDX_TAGS).toContain("Math");
  });
  it("has SSML tags including break and emphasis", () => {
    expect(SSML_TAGS).toContain("break");
    expect(SSML_TAGS).toContain("emphasis");
  });
  it("has HTML tags including sub and sup", () => {
    expect(HTML_TAGS).toContain("sub");
    expect(HTML_TAGS).toContain("sup");
  });
});

describe("getTagList", () => {
  it("returns a formatted string of all tags", () => {
    const list = getTagList();
    expect(list).toContain("Aside");
    expect(list).toContain("break");
    expect(list).toContain("sub");
  });
});

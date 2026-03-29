// test/yaml/frontmatter.test.ts
import { describe, it, expect } from "vitest";
import {
  parseFrontmatter,
  serializeFrontmatter,
  splitDocument,
  ARTICLE_KEYS,
  TAG_KEYS,
  AUTHOR_KEYS,
  validateFields,
  PUBLICATION_STATUSES,
} from "../../src/yaml/frontmatter.js";

describe("splitDocument", () => {
  it("splits frontmatter from body", () => {
    const doc = "---\ntitle: Hello\n---\nBody text here.";
    const { frontmatter, body } = splitDocument(doc);
    expect(frontmatter).toBe("title: Hello");
    expect(body).toBe("Body text here.");
  });
  it("returns null frontmatter when no delimiters", () => {
    const { frontmatter, body } = splitDocument("Just body text.");
    expect(frontmatter).toBeNull();
    expect(body).toBe("Just body text.");
  });
  it("handles empty frontmatter", () => {
    const { frontmatter, body } = splitDocument("---\n---\nBody.");
    expect(frontmatter).toBe("");
    expect(body).toBe("Body.");
  });
});

describe("parseFrontmatter", () => {
  it("parses key-value pairs", () => {
    const meta = parseFrontmatter("title: Hello World\noriginal_path: test.md");
    expect(meta.title).toBe("Hello World");
    expect(meta.original_path).toBe("test.md");
  });
  it("parses list values (tags)", () => {
    const meta = parseFrontmatter("tags:\n  - ethics\n  - ai-safety");
    expect(meta.tags).toEqual(["ethics", "ai-safety"]);
  });
  it("parses list values (authors)", () => {
    const meta = parseFrontmatter("authors:\n  - John Doe\n  - Jane Smith");
    expect(meta.authors).toEqual(["John Doe", "Jane Smith"]);
  });
  it("returns empty object for empty string", () => {
    expect(parseFrontmatter("")).toEqual({});
  });
});

describe("serializeFrontmatter", () => {
  it("round-trips simple metadata", () => {
    const meta = { title: "Test", original_path: "test.md" };
    const serialized = serializeFrontmatter(meta);
    const reparsed = parseFrontmatter(serialized);
    expect(reparsed.title).toBe("Test");
    expect(reparsed.original_path).toBe("test.md");
  });
  it("serializes list values", () => {
    const meta = { tags: ["a", "b"] };
    const serialized = serializeFrontmatter(meta);
    expect(serialized).toContain("- a");
    expect(serialized).toContain("- b");
  });
});

describe("validateFields", () => {
  it("returns no errors for valid article fields", () => {
    const meta = { title: "Test", tags: ["x"], publication_status: "production" };
    const errors = validateFields(meta, "article");
    expect(errors).toHaveLength(0);
  });
  it("flags unknown fields", () => {
    const meta = { title: "Test", titre: "Test FR" };
    const errors = validateFields(meta, "article");
    expect(errors.some((e) => e.includes("titre"))).toBe(true);
  });
  it("flags invalid publication_status", () => {
    const meta = { publication_status: "draft" };
    const errors = validateFields(meta, "article");
    expect(errors.some((e) => e.includes("publication_status"))).toBe(true);
  });
});

describe("key constants", () => {
  it("ARTICLE_KEYS includes title and tags", () => {
    expect(ARTICLE_KEYS).toContain("title");
    expect(ARTICLE_KEYS).toContain("tags");
  });
  it("TAG_KEYS includes original_path", () => {
    expect(TAG_KEYS).toContain("original_path");
  });
  it("AUTHOR_KEYS includes title", () => {
    expect(AUTHOR_KEYS).toContain("title");
  });
  it("PUBLICATION_STATUSES has three values", () => {
    expect(PUBLICATION_STATUSES).toEqual(["unpublished", "test", "production"]);
  });
});

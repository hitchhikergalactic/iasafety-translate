import { describe, it, expect } from "vitest";
import {
  resolveCounterpart,
  translateRelativeLink,
} from "../../src/counterpart/resolve.js";

describe("resolveCounterpart", () => {
  it("resolves translation → original via original_path", () => {
    const result = resolveCounterpart({
      filePath: "/repos/babel-es/articulos/risk.md",
      originalPath: "risk.md",
      bareDirMap: { articulos: "articles" },
      originalsRoot: "/repos/babel-en",
    });
    expect(result).toBe("/repos/babel-en/articles/risk.md");
  });
  it("resolves with nested bare dir translation", () => {
    const result = resolveCounterpart({
      filePath: "/repos/babel-fr/sujets/ai.md",
      originalPath: "ai.md",
      bareDirMap: { sujets: "tags" },
      originalsRoot: "/repos/babel-en",
    });
    expect(result).toBe("/repos/babel-en/tags/ai.md");
  });
});

describe("translateRelativeLink", () => {
  it("translates ./file.md to counterpart", () => {
    const result = translateRelativeLink(
      "./other-article.md",
      "es",
      (file) => `/repos/babel-es/articulos/${file}`
    );
    expect(result).toContain("other-article.md");
  });
  it("preserves anchor fragments", () => {
    const result = translateRelativeLink(
      "./article.md#section",
      "es",
      (file) => `/repos/babel-es/articulos/${file}`
    );
    expect(result).toContain("#section");
  });
  it("returns original link if resolver returns null", () => {
    const result = translateRelativeLink(
      "./unknown.md",
      "es",
      () => null
    );
    expect(result).toBe("./unknown.md");
  });
});

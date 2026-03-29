import { describe, it, expect } from "vitest";
import {
  NEWLINE_TOKEN,
  preprocessText,
  postprocessText,
  modelUsesNewlineWorkaround,
} from "../../src/deepl/newline-workaround.js";

describe("modelUsesNewlineWorkaround", () => {
  it("returns true for quality_optimized", () => {
    expect(modelUsesNewlineWorkaround("quality_optimized")).toBe(true);
  });
  it("returns false for latency_optimized", () => {
    expect(modelUsesNewlineWorkaround("latency_optimized")).toBe(false);
  });
  it("returns false for prefer_quality_optimized", () => {
    expect(modelUsesNewlineWorkaround("prefer_quality_optimized")).toBe(false);
  });
});

describe("preprocessText", () => {
  it("replaces newlines with token in quality_optimized", () => {
    const result = preprocessText("line1\nline2", "quality_optimized");
    expect(result).not.toContain("\n");
    expect(result).toContain(NEWLINE_TOKEN);
  });
  it("leaves text unchanged in latency_optimized", () => {
    expect(preprocessText("line1\nline2", "latency_optimized")).toBe("line1\nline2");
  });
});

describe("postprocessText", () => {
  it("restores newlines from token in quality_optimized", () => {
    const preprocessed = preprocessText("a\nb\nc", "quality_optimized");
    const restored = postprocessText(preprocessed, "quality_optimized");
    expect(restored).toBe("a\nb\nc");
  });
  it("handles trailing space after token", () => {
    const withSpace = `a${NEWLINE_TOKEN} b`;
    const restored = postprocessText(withSpace, "quality_optimized");
    expect(restored).toBe("a\nb");
  });
  it("leaves text unchanged in latency_optimized", () => {
    expect(postprocessText("some text", "latency_optimized")).toBe("some text");
  });
});

describe("round-trip", () => {
  it("preprocess then postprocess returns original", () => {
    const original = "first\nsecond\nthird";
    const processed = preprocessText(original, "quality_optimized");
    const restored = postprocessText(processed, "quality_optimized");
    expect(restored).toBe(original);
  });
});

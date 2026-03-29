import { describe, it, expect } from "vitest";
import { buildChunkRanges, chunkParagraphPairs } from "../../src/revision/chunker.js";
import type { ParagraphPair } from "../../src/revision/paragraphs.js";

describe("buildChunkRanges", () => {
  it("divides evenly", () => {
    expect(buildChunkRanges(10, 5)).toEqual([
      { start: 0, end: 5 },
      { start: 5, end: 10 },
    ]);
  });
  it("handles remainder", () => {
    expect(buildChunkRanges(7, 3)).toEqual([
      { start: 0, end: 3 },
      { start: 3, end: 6 },
      { start: 6, end: 7 },
    ]);
  });
  it("single chunk when total <= chunkSize", () => {
    expect(buildChunkRanges(3, 10)).toEqual([{ start: 0, end: 3 }]);
  });
  it("returns empty for zero total", () => {
    expect(buildChunkRanges(0, 5)).toEqual([]);
  });
});

describe("chunkParagraphPairs", () => {
  it("splits pairs into chunks of given size", () => {
    const pairs: ParagraphPair[] = [
      { source: "s1", translation: "t1" },
      { source: "s2", translation: "t2" },
      { source: "s3", translation: "t3" },
      { source: "s4", translation: "t4" },
      { source: "s5", translation: "t5" },
    ];
    const chunks = chunkParagraphPairs(pairs, 2);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(2);
    expect(chunks[1]).toHaveLength(2);
    expect(chunks[2]).toHaveLength(1);
  });
});

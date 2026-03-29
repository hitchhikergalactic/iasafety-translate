import type { ParagraphPair } from "./paragraphs.js";

export interface ChunkRange { start: number; end: number; }

export function buildChunkRanges(total: number, chunkSize: number): ChunkRange[] {
  if (total <= 0) return [];
  const ranges: ChunkRange[] = [];
  for (let i = 0; i < total; i += chunkSize) {
    ranges.push({ start: i, end: Math.min(i + chunkSize, total) });
  }
  return ranges;
}

export function chunkParagraphPairs(
  pairs: ParagraphPair[],
  chunkSize: number
): ParagraphPair[][] {
  const ranges = buildChunkRanges(pairs.length, chunkSize);
  return ranges.map((r) => pairs.slice(r.start, r.end));
}

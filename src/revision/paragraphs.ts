export interface ParagraphPair {
  source: string;
  translation: string;
}

export function splitIntoParagraphs(text: string): string[] {
  if (!text || text.trim() === "") return [];
  let cleaned = text.replace(/^```\w*\n/gm, "").replace(/^```\s*$/gm, "");
  return cleaned
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export function alignParagraphs(
  source: string[],
  translation: string[]
): ParagraphPair[] {
  const maxLen = Math.max(source.length, translation.length);
  const pairs: ParagraphPair[] = [];
  for (let i = 0; i < maxLen; i++) {
    pairs.push({
      source: source[i] ?? "",
      translation: translation[i] ?? "",
    });
  }
  return pairs;
}

export function formatParagraphPairs(pairs: ParagraphPair[]): string {
  return pairs
    .map(
      (p, i) =>
        `[Paragraph ${i + 1}]\nOriginal: ${p.source}\nTranslation: ${p.translation}`
    )
    .join("\n\n");
}

import { getThousandsSeparator } from "../config/languages.js";

export function insertThousandsSeparators(
  text: string,
  langCode: string
): string {
  const sep = getThousandsSeparator(langCode);
  if (!sep) return text;

  const protectedRanges = getProtectedRanges(text);

  return text.replace(/\b(\d{4,})\b/g, (match, digits, offset) => {
    if (isProtected(offset, offset + match.length, protectedRanges)) {
      return match;
    }
    return addSeparator(digits, sep);
  });
}

function addSeparator(digits: string, sep: string): string {
  const parts: string[] = [];
  let i = digits.length;
  while (i > 0) {
    const start = Math.max(0, i - 3);
    parts.unshift(digits.slice(start, i));
    i = start;
  }
  return parts.join(sep);
}

interface Range { start: number; end: number; }

function getProtectedRanges(text: string): Range[] {
  const ranges: Range[] = [];
  const urlRegex = /https?:\/\/[^\s)>\]]+/g;
  let m: RegExpExecArray | null;
  while ((m = urlRegex.exec(text)) !== null) {
    ranges.push({ start: m.index, end: m.index + m[0].length });
  }
  const mathRegex = /<Math[^>]*>[\s\S]*?<\/Math>/g;
  while ((m = mathRegex.exec(text)) !== null) {
    ranges.push({ start: m.index, end: m.index + m[0].length });
  }
  return ranges;
}

function isProtected(start: number, end: number, ranges: Range[]): boolean {
  return ranges.some((r) => start >= r.start && end <= r.end);
}

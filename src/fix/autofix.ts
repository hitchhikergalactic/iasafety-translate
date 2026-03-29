import { LANGUAGE_RULES } from "./rules.js";

export function applyLanguageFixes(text: string, langCode: string): string {
  const rules = LANGUAGE_RULES[langCode];
  if (!rules) return text;
  let result = text;
  for (const rule of rules) {
    result = result.replace(new RegExp(rule.search, "g"), rule.replace);
  }
  return result;
}

export function fixCurlyQuotes(text: string): string {
  return text.replace(/[\u201C\u201D](\[\^)/g, '"$1');
}

export function fixPeriodsInHeadings(text: string): string {
  return text.replace(/^(#{2,6}\s+.*)\.$/gm, "$1");
}

export function fixPercentSigns(text: string): string {
  return text.replace(
    /(\d+(?:[,()]\d+)*)%([^";:\w]|$)/g,
    "$1\u202F%$2"
  );
}

export function fixThinSpaces(text: string): string {
  return text.replaceAll("\u2009", "\u202F");
}

export function fixSuperscripts(text: string): string {
  return text.replace(/\^(\d+)\^/g, "<sup>$1</sup>");
}

export function checkHeadingHierarchy(text: string): string[] {
  const errors: string[] = [];
  const headingRegex = /^(#{2,6})\s/gm;
  let prevLevel = 1;
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(text)) !== null) {
    const level = match[1].length;
    if (level > prevLevel + 1) {
      errors.push(
        `Heading level ${level} skips from level ${prevLevel} at offset ${match.index}`
      );
    }
    prevLevel = level;
  }
  return errors;
}

const PAIRED_CHARS: Array<[string, string]> = [
  ["(", ")"],
  ["[", "]"],
  ["{", "}"],
  ["«", "»"],
  ["\u201C", "\u201D"],
];

export function checkUnbalancedCharacters(text: string): string[] {
  const errors: string[] = [];
  for (const [open, close] of PAIRED_CHARS) {
    const stack: number[] = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === open) {
        stack.push(i);
      } else if (ch === close) {
        if (stack.length === 0) {
          errors.push(`Unmatched closing '${close}' at position ${i}`);
        } else {
          stack.pop();
        }
      }
    }
    for (const pos of stack) {
      errors.push(`Unmatched opening '${open}' at position ${pos}`);
    }
  }
  return errors;
}

export function autofix(text: string, langCode: string): string {
  let result = text;
  result = applyLanguageFixes(result, langCode);
  result = fixCurlyQuotes(result);
  result = fixPeriodsInHeadings(result);
  result = fixPercentSigns(result);
  result = fixThinSpaces(result);
  result = fixSuperscripts(result);
  return result;
}

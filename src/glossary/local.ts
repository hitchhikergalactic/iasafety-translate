export interface GlossaryEntry {
  en: string;
  type?: string;
  [langCode: string]: string | undefined;
}

export function parseGlossary(json: string): GlossaryEntry[] {
  return JSON.parse(json) as GlossaryEntry[];
}

export function getTermsForLanguage(
  glossary: GlossaryEntry[],
  langCode: string
): GlossaryEntry[] {
  return glossary.filter((entry) => {
    const val = entry[langCode];
    return typeof val === "string" && val.length > 0;
  });
}

export function getMissingTerms(
  glossary: GlossaryEntry[],
  langCode: string
): GlossaryEntry[] {
  return glossary.filter((entry) => {
    const val = entry[langCode];
    return val === undefined || val === "";
  });
}

export function formatGlossaryForDeepL(
  glossary: GlossaryEntry[],
  targetLangCode: string
): string {
  return getTermsForLanguage(glossary, targetLangCode)
    .map((entry) => `${entry.en}\t${entry[targetLangCode]}`)
    .join("\n");
}

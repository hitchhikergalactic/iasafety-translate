// src/config/prompts.ts

/**
 * All AI prompts ported verbatim from tlon.el.
 * Format specifiers use %s-style placeholders — call buildPrompt() to fill them.
 */

/** Prefix for all paragraph-level revision prompts.
 *  %1$s = target file name, %2$s = target language name */
export const REVISE_PREFIX =
  "I am sharing with you a series of paragraph pairs. Each pair consists of an original paragraph in English and a translation of it into %2$s. ";

/** Suffix for all paragraph-level revision prompts.
 *  %1$s = target file name */
export const REVISE_SUFFIX =
  'Only after you are done comparing the paragraphs and determining all the changes that should be made to the translation, return ONLY the revised translation paragraph(s) corresponding to what I shared, in the same order, and nothing else. Do not include the original paragraphs. Do not include any explanation, comments, or Markdown code fences. Output plain text only. You must not modify any other parts of the file ("%1$s"); only modify the paragraphs I shared with you.\n\nHere are the paragraph pairs:\n\n';

/**
 * Spot-errors prompt. Inserted between REVISE_PREFIX and REVISE_SUFFIX.
 * %1$s = tag list (string), %2$s = YAML delimiter ("---\n")
 */
export const SPOT_ERRORS_BODY =
  'Your task is to read both carefully and try to spot errors in the translation: the code surrounding the translation may have been corrupted, there may be sentences and even paragraphs missing, the abbreviations may be used wrongly or inconsistently, etc. In addition, the custom tags we use, which should remain invariant, may have been inadvertently translated; if so, you should restore them to their original form. This is an exhaustive list of all our custom tags: %1$s. Do not modify any URLs or BibTeX keys. Similarly, the fields in the YAML metadata section at the beginning of the file (delimited by \'%2$s\') may have been modified. The only admissible YAML fields are: ("title" "html_title" "key" "original_path" "tags" "publication_status" "meta" "snippet"). If you find a field with any other name, you should convert it to the closest valid alternative. For example, if you find "titre", you should convert it to "title". ';

/** Improve-flow prompt body. Inserted between REVISE_PREFIX and REVISE_SUFFIX. */
export const IMPROVE_FLOW_BODY =
  "Your task is to read both carefully and try to improve the translation for a better flow. Do not modify URLs, BibTeX keys, or tags enclosed in angular brackets (such as \"<Roman>\", \"<LiteralLink>\", etc.)";

/**
 * Global review prompt (applied to full document, not chunks).
 * %s = target language name
 */
export const GLOBAL_REVIEW =
  `I am sharing with you a complete article that has been translated from English into %s, along with the English original. The translation was produced in two phases: first, machine translation (DeepL), then paragraph-by-paragraph AI revision. Your task is to perform a final global review of the translation---the kind of review a human editor would do after the paragraph-level corrections:

a) Fix terminological inconsistencies: the two-phase process may have introduced different translations for the same term in different paragraphs. Ensure that key terms are translated consistently throughout the entire article. %s

b) Check overall coherence and meaning: read the translation as a whole and verify that it reads naturally and makes sense. If anything sounds odd, awkward, or potentially incorrect, compare it with the English original and correct the translation as needed.

Do not modify URLs, BibTeX keys, or custom tags enclosed in angular brackets (such as "<Roman>", "<LiteralLink>", etc.). Do not modify the YAML metadata section at the beginning of the file (delimited by '---').

Return ONLY the complete revised translation (including the YAML metadata section unchanged), and nothing else. Do not include any explanation, comments, or Markdown code fences. Output plain text only.`;

/**
 * Glossary attachment instruction. %s = glossary filename.
 */
export const GLOSSARY_ATTACHMENT =
  " I have attached a glossary file named \`%s\`. It lists English terms and their required translations into the target language. Use the attached glossary mappings exactly whenever a glossary term appears; if a term is not listed, choose a translation consistent with the glossary's terminology and style.";

/**
 * AI glossary generation prompt.
 * Args: sourceLangName, targetLangName, sourceLangName, targetLangName, termsList, targetLangName
 */
export const CREATE_GLOSSARY_LANGUAGE =
  "You are an expert multilingual glossary creator.\n\nYour task is to generate translations from the source language (%s) into the target language (%s).\n\nI will provide you with a list of terms in %s (one term per line) that currently lack a translation in %s.\n\nHere is the list of source-language terms needing translation:\n```text\n%s\n```\n\nPlease return *only* the translations for these terms into %s, one translation per line.\n\nExample output format:\n```text\nTranslation 1\nTranslation 2\nTranslation 3\n...\n```\n\n- Provide *exactly one* translation line for *every* input term.\n- Maintain the exact order of the translations corresponding to the input terms.\n- If you are unsure about a translation, provide your best guess or use the placeholder string \"[TRANSLATION_UNAVAILABLE]\". *Do not omit any terms.*\n- The total number of lines in your response *must* equal the number of lines in the input list.\n- Do *not* include the original source terms in your response.\n- Do *not* include any explanations, introductory text, numbering, bullet points, or any JSON/Markdown formatting. Return only the plain text translations, one per line.";

/**
 * Glossary verification prompt.
 * Args: targetLangName, expectedCount, textBlock, expectedCount
 */
export const VERIFY_GLOSSARY_TRANSLATIONS =
  "You are a text cleaning expert. I received the following text block which is *supposed* to be a list of translations into %s, one per line, corresponding to %d source terms. However, it might contain errors, extra text, incorrect formatting, or an incorrect number of lines.\n\nPlease analyze the following text block:\n```text\n%s\n```\n\nYour task is to return *only* the cleaned list of translations, one per line.\n- Ensure there are *exactly* %d lines in your output.\n- Each line should contain only the translation for the corresponding term.\n- Remove any introductory text, explanations, numbering, bullet points, JSON/Markdown formatting, or other extraneous content.\n- If the input seems corrupt or unusable for a specific line, use the placeholder \"[TRANSLATION_UNAVAILABLE]\".\n- If the input has fewer lines than expected, add placeholder lines at the end to reach the expected count.\n- If the input has more lines than expected, truncate it to the expected count.\n- Return *only* the plain text translations, one per line.";

/**
 * Glossary filtering prompt (extract relevant terms for a document).
 * Args: sourceLangName, documentText, candidateTerms
 */
export const FILTER_GLOSSARY =
  "You will receive (1) the full text of a source document in %s and (2) a list of candidate glossary terms (one per line).\n\nYour task is to return only the subset of candidate terms that are relevant to the document.\n\nA term is relevant if the exact term appears in the document (case-insensitive) or if a very obvious inflectional or spacing/hyphenation variant appears (e.g., plural/singular, capitalization, hyphen vs. space). Do not include synonyms or paraphrases that are not in the candidate list.\n\nReturn only the selected terms, one per line, exactly as they appear in the candidate list. Do not add explanations, numbering, bullet points, or any other formatting.\n\nDocument:%sCandidate terms:%s";

/**
 * Sprintf-style replacement supporting both sequential (%s, %d) and
 * positional (%1$s, %2$s) specifiers. Positional args are 1-indexed.
 */
export function buildPrompt(
  template: string,
  ...args: (string | number)[]
): string {
  let seqIndex = 0;
  return template.replace(/%(?:(\d+)\$)?([sd])/g, (_match, pos, _type) => {
    if (pos !== undefined) {
      return String(args[Number(pos) - 1] ?? "");
    }
    return String(args[seqIndex++] ?? "");
  });
}

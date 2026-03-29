// src/glossary/ai.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  CREATE_GLOSSARY_LANGUAGE,
  VERIFY_GLOSSARY_TRANSLATIONS,
  FILTER_GLOSSARY,
  buildPrompt,
} from "../config/prompts.js";
import type { GlossaryEntry } from "./local.js";
import { getMissingTerms } from "./local.js";

export interface GeneratedTranslation {
  en: string;
  translation: string;
}

/** Parse the AI-generated translations response into structured pairs. */
export function parseGeneratedTranslations(
  response: string,
  sourceTerms: string[],
): GeneratedTranslation[] {
  const lines = response.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  return sourceTerms.map((en, i) => ({
    en,
    translation: i < lines.length ? lines[i] : "[TRANSLATION_UNAVAILABLE]",
  }));
}

/** Merge generated translations back into a glossary. Skips unavailable ones. */
export function mergeTranslations(
  glossary: GlossaryEntry[],
  generated: GeneratedTranslation[],
  langCode: string,
): GlossaryEntry[] {
  const translationMap = new Map(generated.map((g) => [g.en, g.translation]));
  return glossary.map((entry) => {
    const translation = translationMap.get(entry.en);
    if (translation && translation !== "[TRANSLATION_UNAVAILABLE]") {
      return { ...entry, [langCode]: translation };
    }
    return entry;
  });
}

/** Parse filter response into a list of relevant terms. */
export function filterRelevantTerms(response: string): string[] {
  return response.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
}

/** Generate translations for missing glossary terms using AI. */
export async function generateMissingTranslations(
  glossary: GlossaryEntry[],
  langCode: string,
  langName: string,
  apiKey: string,
  model: string = "gemini-2.0-flash",
): Promise<GeneratedTranslation[]> {
  const missing = getMissingTerms(glossary, langCode);
  if (missing.length === 0) return [];

  const termsList = missing.map((e) => e.en).join("\n");
  const prompt = buildPrompt(
    CREATE_GLOSSARY_LANGUAGE,
    "English", langName, "English", langName, termsList, langName,
  );

  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({ model });
  const result = await genModel.generateContent(prompt);
  const rawResponse = result.response.text();

  // Verify the response
  const verifyPrompt = buildPrompt(
    VERIFY_GLOSSARY_TRANSLATIONS,
    langName, missing.length, rawResponse, missing.length,
  );
  const verifyResult = await genModel.generateContent(verifyPrompt);
  const verifiedResponse = verifyResult.response.text();

  return parseGeneratedTranslations(verifiedResponse, missing.map((e) => e.en));
}

/** Filter glossary terms relevant to a document. */
export async function filterGlossaryForDocument(
  documentText: string,
  candidateTerms: string[],
  sourceLangName: string,
  apiKey: string,
  model: string = "gemini-2.0-flash",
): Promise<string[]> {
  if (candidateTerms.length === 0) return [];

  const prompt = buildPrompt(
    FILTER_GLOSSARY,
    sourceLangName,
    "\n" + documentText + "\n",
    "\n" + candidateTerms.join("\n") + "\n",
  );

  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({ model });
  const result = await genModel.generateContent(prompt);
  return filterRelevantTerms(result.response.text());
}

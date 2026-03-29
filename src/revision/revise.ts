import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  REVISE_PREFIX,
  REVISE_SUFFIX,
  SPOT_ERRORS_BODY,
  IMPROVE_FLOW_BODY,
  GLOBAL_REVIEW,
  GLOSSARY_ATTACHMENT,
  buildPrompt,
} from "../config/prompts.js";
import { getTagList } from "../markdown/tags.js";
import { YAML_DELIMITER } from "../yaml/frontmatter.js";
import {
  splitIntoParagraphs,
  alignParagraphs,
  formatParagraphPairs,
  type ParagraphPair,
} from "./paragraphs.js";
import { chunkParagraphPairs } from "./chunker.js";

export interface RevisionConfig {
  googleApiKey: string;
  targetLanguage: string;
  targetFileName: string;
  chunkSize?: number;
  maxParallel?: number;
  glossaryFileName?: string;
  spotErrorsModel?: string;
  improveFlowModel?: string;
  globalReviewModel?: string;
}

const DEFAULT_SPOT_ERRORS_MODEL = "gemini-2.0-flash";
const DEFAULT_IMPROVE_FLOW_MODEL = "gemini-2.0-pro";
const DEFAULT_GLOBAL_REVIEW_MODEL = "gemini-2.0-pro";

export async function reviseTranslation(
  sourceText: string,
  translatedText: string,
  config: RevisionConfig
): Promise<string> {
  const chunkSize = config.chunkSize ?? 10;
  const maxParallel = config.maxParallel ?? 3;

  const afterSpotErrors = await runParagraphPass(
    sourceText,
    translatedText,
    buildSpotErrorsPrompt(config),
    config.spotErrorsModel ?? DEFAULT_SPOT_ERRORS_MODEL,
    config.googleApiKey,
    chunkSize,
    maxParallel,
  );

  const afterFlow = await runParagraphPass(
    sourceText,
    afterSpotErrors,
    buildImproveFlowPrompt(config),
    config.improveFlowModel ?? DEFAULT_IMPROVE_FLOW_MODEL,
    config.googleApiKey,
    chunkSize,
    maxParallel,
  );

  const final = await runGlobalReview(
    sourceText,
    afterFlow,
    config,
  );

  return final;
}

function buildSpotErrorsPrompt(config: RevisionConfig): string {
  const tagList = getTagList();
  const prefix = buildPrompt(REVISE_PREFIX, config.targetFileName, config.targetLanguage);
  const body = buildPrompt(SPOT_ERRORS_BODY, tagList, YAML_DELIMITER);
  const suffix = buildPrompt(REVISE_SUFFIX, config.targetFileName);
  const glossary = config.glossaryFileName
    ? buildPrompt(GLOSSARY_ATTACHMENT, config.glossaryFileName)
    : "";
  return prefix + body + glossary + suffix;
}

function buildImproveFlowPrompt(config: RevisionConfig): string {
  const prefix = buildPrompt(REVISE_PREFIX, config.targetFileName, config.targetLanguage);
  const suffix = buildPrompt(REVISE_SUFFIX, config.targetFileName);
  const glossary = config.glossaryFileName
    ? buildPrompt(GLOSSARY_ATTACHMENT, config.glossaryFileName)
    : "";
  return prefix + IMPROVE_FLOW_BODY + glossary + suffix;
}

async function runParagraphPass(
  sourceText: string,
  translatedText: string,
  systemPrompt: string,
  modelName: string,
  apiKey: string,
  chunkSize: number,
  maxParallel: number,
): Promise<string> {
  const sourceParagraphs = splitIntoParagraphs(sourceText);
  const translationParagraphs = splitIntoParagraphs(translatedText);
  const pairs = alignParagraphs(sourceParagraphs, translationParagraphs);
  const chunks = chunkParagraphPairs(pairs, chunkSize);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const results: string[][] = new Array(chunks.length);

  for (let i = 0; i < chunks.length; i += maxParallel) {
    const batch = chunks.slice(i, i + maxParallel);
    const batchPromises = batch.map(async (chunk, batchIdx) => {
      const formatted = formatParagraphPairs(chunk);
      const prompt = systemPrompt + formatted;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return {
        index: i + batchIdx,
        paragraphs: splitIntoParagraphs(text),
      };
    });
    const batchResults = await Promise.all(batchPromises);
    for (const r of batchResults) {
      results[r.index] = r.paragraphs;
    }
  }

  return results.flat().join("\n\n");
}

async function runGlobalReview(
  sourceText: string,
  translatedText: string,
  config: RevisionConfig,
): Promise<string> {
  const genAI = new GoogleGenerativeAI(config.googleApiKey);
  const model = genAI.getGenerativeModel({
    model: config.globalReviewModel ?? DEFAULT_GLOBAL_REVIEW_MODEL,
  });

  const prompt = buildPrompt(GLOBAL_REVIEW, config.targetLanguage) +
    "\n\n--- ENGLISH ORIGINAL ---\n" + sourceText +
    "\n\n--- TRANSLATION ---\n" + translatedText;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

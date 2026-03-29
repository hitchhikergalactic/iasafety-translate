import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname, basename } from "path";
import { loadKeys } from "./config/keys.js";
import { getLanguageByName } from "./config/languages.js";
import { translateText } from "./deepl/client.js";
import type { DeepLModelType } from "./deepl/newline-workaround.js";
import { splitDocument, parseFrontmatter, assembleDocument } from "./yaml/frontmatter.js";
import { reviseTranslation } from "./revision/revise.js";
import { autofix } from "./fix/autofix.js";
import { insertThousandsSeparators } from "./fix/thousands.js";
import { findGlossary } from "./glossary/deepl.js";

export interface PipelineOptions {
  sourceFile: string;
  targetLanguage: string;
  sourceLanguage?: string;
  outputFile?: string;
  deeplModelType?: DeepLModelType;
  chunkSize?: number;
  maxParallel?: number;
  skipRevision?: boolean;
  skipAutofix?: boolean;
}

export interface PipelineResult {
  outputFile: string;
  stages: string[];
}

export async function translateFile(
  opts: PipelineOptions
): Promise<PipelineResult> {
  const stages: string[] = [];
  const keys = await loadKeys();

  const lang = getLanguageByName(opts.targetLanguage);
  if (!lang) throw new Error(`Unknown language: "${opts.targetLanguage}"`);
  const srcLang = getLanguageByName(opts.sourceLanguage ?? "english");
  if (!srcLang) throw new Error(`Unknown source language: "${opts.sourceLanguage}"`);

  const sourceContent = await readFile(opts.sourceFile, "utf-8");
  const { frontmatter, body } = splitDocument(sourceContent);
  const sourceMeta = frontmatter ? parseFrontmatter(frontmatter) : {};

  const glossary = await findGlossary(keys.deepl, srcLang.code.toUpperCase(), lang.code.toUpperCase());

  const translatedBody = await translateText({
    text: body,
    sourceLang: srcLang.code.toUpperCase(),
    targetLang: lang.code.toUpperCase(),
    apiKey: keys.deepl,
    modelType: opts.deeplModelType ?? "quality_optimized",
    glossaryId: glossary?.glossary_id,
  });
  stages.push("deepl-translate");

  let revisedBody = translatedBody;
  if (!opts.skipRevision) {
    const outputName = basename(opts.outputFile ?? opts.sourceFile);
    revisedBody = await reviseTranslation(body, translatedBody, {
      googleApiKey: keys.google,
      targetLanguage: opts.targetLanguage,
      targetFileName: outputName,
      chunkSize: opts.chunkSize,
      maxParallel: opts.maxParallel,
    });
    stages.push("spot-errors", "improve-flow", "global-review");
  }

  let fixedBody = revisedBody;
  if (!opts.skipAutofix) {
    fixedBody = autofix(fixedBody, lang.code);
    fixedBody = insertThousandsSeparators(fixedBody, lang.code);
    stages.push("autofix");
  }

  const translationMeta: Record<string, unknown> = {
    ...sourceMeta,
    original_path: basename(opts.sourceFile),
    publication_status: "unpublished",
  };
  const outputContent = assembleDocument(translationMeta, fixedBody);

  const outputFile =
    opts.outputFile ??
    opts.sourceFile.replace(/\.md$/, `.${lang.code}.md`);
  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, outputContent, "utf-8");
  stages.push("write-output");

  return { outputFile, stages };
}

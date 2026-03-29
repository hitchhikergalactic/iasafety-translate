import express from "express";
import { loadKeys, type Keys } from "../src/config/keys.js";
import { PROJECT_LANGUAGES, getLanguageByName, getLanguageByCode } from "../src/config/languages.js";
import { translateText } from "../src/deepl/client.js";
import type { DeepLModelType } from "../src/deepl/newline-workaround.js";
import { reviseTranslation, type RevisionConfig } from "../src/revision/revise.js";
import { autofix } from "../src/fix/autofix.js";
import { insertThousandsSeparators } from "../src/fix/thousands.js";
import { checkHeadingHierarchy, checkUnbalancedCharacters } from "../src/fix/autofix.js";
import { applyLanguageFixes } from "../src/fix/autofix.js";
import { splitDocument, parseFrontmatter, serializeFrontmatter, validateFields } from "../src/yaml/frontmatter.js";
import { parseGlossary, getTermsForLanguage, getMissingTerms, formatGlossaryForDeepL } from "../src/glossary/local.js";
import { listGlossaries, createGlossary, deleteGlossary } from "../src/glossary/deepl.js";
import { generateMissingTranslations, filterGlossaryForDocument, mergeTranslations } from "../src/glossary/ai.js";
import { getTagList } from "../src/markdown/tags.js";
import { fetchPage } from "../src/import/fetcher.js";
import { detectSource, extractContent } from "../src/import/extractors.js";

const app = express();
app.use(express.json({ limit: "5mb" }));

let keysCache: Keys | null = null;
async function getKeys(): Promise<Keys> {
  if (!keysCache) keysCache = await loadKeys();
  return keysCache;
}

app.get("/api/languages", (_req, res) => {
  res.json({
    languages: PROJECT_LANGUAGES.filter((l) => l !== "english"),
    all: PROJECT_LANGUAGES,
  });
});

app.get("/api/tags", (_req, res) => {
  res.json({ tagList: getTagList() });
});

app.post("/api/translate/deepl", async (req, res) => {
  try {
    const { text, targetLanguage, modelType = "quality_optimized" } = req.body;
    const keys = await getKeys();
    const lang = getLanguageByName(targetLanguage);
    if (!lang) return res.status(400).json({ error: `Unknown language: ${targetLanguage}` });
    const result = await translateText({
      text, sourceLang: "EN", targetLang: lang.code.toUpperCase(),
      apiKey: keys.deepl, modelType: modelType as DeepLModelType,
    });
    res.json({ result });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/translate/revise", async (req, res) => {
  try {
    const { sourceText, translatedText, targetLanguage } = req.body;
    const keys = await getKeys();
    const config: RevisionConfig = {
      googleApiKey: keys.google, targetLanguage,
      targetFileName: "web-input.md",
      chunkSize: req.body.chunkSize ?? 10,
      maxParallel: req.body.maxParallel ?? 3,
    };
    const result = await reviseTranslation(sourceText, translatedText, config);
    res.json({ result });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/fix/autofix", (req, res) => {
  try {
    const { text, langCode } = req.body;
    let result = autofix(text, langCode);
    result = insertThousandsSeparators(result, langCode);
    res.json({ result });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/fix/language", (req, res) => {
  try {
    const { text, langCode } = req.body;
    res.json({ result: applyLanguageFixes(text, langCode) });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/fix/check", (req, res) => {
  try {
    const { text } = req.body;
    res.json({ headingErrors: checkHeadingHierarchy(text), balanceErrors: checkUnbalancedCharacters(text) });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/yaml/parse", (req, res) => {
  try {
    const { document } = req.body;
    const { frontmatter, body } = splitDocument(document);
    res.json({ frontmatter: frontmatter ? parseFrontmatter(frontmatter) : null, body });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/yaml/validate", (req, res) => {
  try {
    const { meta, type } = req.body;
    const errors = validateFields(meta, type);
    res.json({ errors, valid: errors.length === 0 });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/glossary/parse", (req, res) => {
  try {
    const { json, langCode } = req.body;
    const glossary = parseGlossary(json);
    const terms = getTermsForLanguage(glossary, langCode);
    const missing = getMissingTerms(glossary, langCode);
    const tsv = formatGlossaryForDeepL(glossary, langCode);
    res.json({
      totalEntries: glossary.length, termsWithTranslation: terms.length,
      termsMissing: missing.length, missingTerms: missing.map((e) => e.en), deeplTsv: tsv,
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/glossary/deepl", async (_req, res) => {
  try {
    const keys = await getKeys();
    res.json({ glossaries: await listGlossaries(keys.deepl) });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/glossary/deepl", async (req, res) => {
  try {
    const { name, sourceLang, targetLang, entriesTsv } = req.body;
    const keys = await getKeys();
    res.json({ glossary: await createGlossary(keys.deepl, name, sourceLang, targetLang, entriesTsv) });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/glossary/deepl/:id", async (req, res) => {
  try {
    const keys = await getKeys();
    await deleteGlossary(keys.deepl, req.params.id);
    res.json({ ok: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/glossary/generate", async (req, res) => {
  try {
    const { glossaryJson, langCode, langName } = req.body;
    if (!glossaryJson || !langCode || !langName)
      return res.status(400).json({ error: "glossaryJson, langCode, and langName are required" });
    const keys = await getKeys();
    const glossary = parseGlossary(glossaryJson);
    const generated = await generateMissingTranslations(glossary, langCode, langName, keys.google);
    const merged = mergeTranslations(glossary, generated, langCode);
    res.json({
      generated: generated.filter((g) => g.translation !== "[TRANSLATION_UNAVAILABLE]"),
      unavailable: generated.filter((g) => g.translation === "[TRANSLATION_UNAVAILABLE]").map((g) => g.en),
      updatedGlossary: merged,
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/glossary/filter", async (req, res) => {
  try {
    const { documentText, candidateTerms } = req.body;
    if (!documentText || !candidateTerms)
      return res.status(400).json({ error: "documentText and candidateTerms are required" });
    const keys = await getKeys();
    const relevant = await filterGlossaryForDocument(documentText, candidateTerms, "English", keys.google);
    res.json({ relevantTerms: relevant, count: relevant.length });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/pipeline", async (req, res) => {
  try {
    const {
      text, targetLanguage, modelType = "quality_optimized",
      skipRevision = false, skipAutofix = false,
      chunkSize = 10, maxParallel = 3,
    } = req.body;
    const keys = await getKeys();
    const lang = getLanguageByName(targetLanguage);
    if (!lang) return res.status(400).json({ error: `Unknown language: ${targetLanguage}` });

    const stages: Array<{ name: string; output: string; durationMs: number }> = [];
    let t0 = Date.now();
    const translated = await translateText({
      text, sourceLang: "EN", targetLang: lang.code.toUpperCase(),
      apiKey: keys.deepl, modelType: modelType as DeepLModelType,
    });
    stages.push({ name: "DeepL Translation", output: translated, durationMs: Date.now() - t0 });

    let revised = translated;
    if (!skipRevision) {
      t0 = Date.now();
      revised = await reviseTranslation(text, translated, {
        googleApiKey: keys.google, targetLanguage,
        targetFileName: "web-input.md", chunkSize, maxParallel,
      });
      stages.push({ name: "AI Revision (3 passes)", output: revised, durationMs: Date.now() - t0 });
    }

    let fixed = revised;
    if (!skipAutofix) {
      t0 = Date.now();
      fixed = autofix(fixed, lang.code);
      fixed = insertThousandsSeparators(fixed, lang.code);
      stages.push({ name: "Auto-fixes", output: fixed, durationMs: Date.now() - t0 });
    }

    res.json({ final: fixed, stages });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/import", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string")
      return res.status(400).json({ error: "URL is required" });
    const { html } = await fetchPage(url);
    const source = detectSource(url);
    res.json(extractContent(html, source));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/health", async (_req, res) => {
  try {
    const keys = await getKeys();
    res.json({ ok: true, hasDeepL: !!keys.deepl, hasGoogle: !!keys.google });
  } catch (err: any) { res.json({ ok: false, error: err.message }); }
});

export default app;

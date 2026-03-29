import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { loadKeys, type Keys } from "./config/keys.js";
import { PROJECT_LANGUAGES, getLanguageByName, getLanguageByCode } from "./config/languages.js";
import { translateText } from "./deepl/client.js";
import type { DeepLModelType } from "./deepl/newline-workaround.js";
import { reviseTranslation, type RevisionConfig } from "./revision/revise.js";
import { autofix } from "./fix/autofix.js";
import { insertThousandsSeparators } from "./fix/thousands.js";
import { checkHeadingHierarchy, checkUnbalancedCharacters } from "./fix/autofix.js";
import { applyLanguageFixes } from "./fix/autofix.js";
import { splitDocument, parseFrontmatter, serializeFrontmatter, validateFields } from "./yaml/frontmatter.js";
import { parseGlossary, getTermsForLanguage, getMissingTerms, formatGlossaryForDeepL } from "./glossary/local.js";
import { listGlossaries, createGlossary, deleteGlossary } from "./glossary/deepl.js";
import { getTagList } from "./markdown/tags.js";
import { buildPrompt, REVISE_PREFIX, SPOT_ERRORS_BODY, IMPROVE_FLOW_BODY, GLOBAL_REVIEW } from "./config/prompts.js";
import { fetchPage } from "./import/fetcher.js";
import { detectSource, extractContent } from "./import/extractors.js";
import { discoverFiles } from "./batch/runner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(express.static(join(__dirname, "../public")));

let keysCache: Keys | null = null;
async function getKeys(): Promise<Keys> {
  if (!keysCache) keysCache = await loadKeys();
  return keysCache;
}

// --- API routes ---

app.get("/api/languages", (_req, res) => {
  res.json({
    languages: PROJECT_LANGUAGES.filter((l) => l !== "english"),
    all: PROJECT_LANGUAGES,
  });
});

app.get("/api/tags", (_req, res) => {
  res.json({ tagList: getTagList() });
});

// DeepL translate
app.post("/api/translate/deepl", async (req, res) => {
  try {
    const { text, targetLanguage, modelType = "quality_optimized" } = req.body;
    const keys = await getKeys();
    const lang = getLanguageByName(targetLanguage);
    if (!lang) return res.status(400).json({ error: `Unknown language: ${targetLanguage}` });

    const result = await translateText({
      text,
      sourceLang: "EN",
      targetLang: lang.code.toUpperCase(),
      apiKey: keys.deepl,
      modelType: modelType as DeepLModelType,
    });
    res.json({ result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI revision (all 3 passes)
app.post("/api/translate/revise", async (req, res) => {
  try {
    const { sourceText, translatedText, targetLanguage, passes } = req.body;
    const keys = await getKeys();

    const config: RevisionConfig = {
      googleApiKey: keys.google,
      targetLanguage,
      targetFileName: "web-input.md",
      chunkSize: req.body.chunkSize ?? 10,
      maxParallel: req.body.maxParallel ?? 3,
    };

    // If specific passes requested, we'd need to expose individual passes
    // For now, run all three
    const result = await reviseTranslation(sourceText, translatedText, config);
    res.json({ result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-fix
app.post("/api/fix/autofix", (req, res) => {
  try {
    const { text, langCode } = req.body;
    let result = autofix(text, langCode);
    result = insertThousandsSeparators(result, langCode);
    res.json({ result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Language-specific fixes only
app.post("/api/fix/language", (req, res) => {
  try {
    const { text, langCode } = req.body;
    const result = applyLanguageFixes(text, langCode);
    res.json({ result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Structural checks
app.post("/api/fix/check", (req, res) => {
  try {
    const { text } = req.body;
    const headingErrors = checkHeadingHierarchy(text);
    const balanceErrors = checkUnbalancedCharacters(text);
    res.json({ headingErrors, balanceErrors });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// YAML parse
app.post("/api/yaml/parse", (req, res) => {
  try {
    const { document } = req.body;
    const { frontmatter, body } = splitDocument(document);
    const meta = frontmatter ? parseFrontmatter(frontmatter) : null;
    res.json({ frontmatter: meta, body });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// YAML validate
app.post("/api/yaml/validate", (req, res) => {
  try {
    const { meta, type } = req.body;
    const errors = validateFields(meta, type);
    res.json({ errors, valid: errors.length === 0 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Glossary - parse and query
app.post("/api/glossary/parse", (req, res) => {
  try {
    const { json, langCode } = req.body;
    const glossary = parseGlossary(json);
    const terms = getTermsForLanguage(glossary, langCode);
    const missing = getMissingTerms(glossary, langCode);
    const tsv = formatGlossaryForDeepL(glossary, langCode);
    res.json({
      totalEntries: glossary.length,
      termsWithTranslation: terms.length,
      termsMissing: missing.length,
      missingTerms: missing.map((e) => e.en),
      deeplTsv: tsv,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DeepL glossary CRUD
app.get("/api/glossary/deepl", async (_req, res) => {
  try {
    const keys = await getKeys();
    const glossaries = await listGlossaries(keys.deepl);
    res.json({ glossaries });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/glossary/deepl", async (req, res) => {
  try {
    const { name, sourceLang, targetLang, entriesTsv } = req.body;
    const keys = await getKeys();
    const glossary = await createGlossary(keys.deepl, name, sourceLang, targetLang, entriesTsv);
    res.json({ glossary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/glossary/deepl/:id", async (req, res) => {
  try {
    const keys = await getKeys();
    await deleteGlossary(keys.deepl, req.params.id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Full pipeline (text-based, not file-based)
app.post("/api/pipeline", async (req, res) => {
  try {
    const {
      text,
      targetLanguage,
      modelType = "quality_optimized",
      skipRevision = false,
      skipAutofix = false,
      chunkSize = 10,
      maxParallel = 3,
    } = req.body;

    const keys = await getKeys();
    const lang = getLanguageByName(targetLanguage);
    if (!lang) return res.status(400).json({ error: `Unknown language: ${targetLanguage}` });

    const stages: Array<{ name: string; output: string; durationMs: number }> = [];

    // Stage 1: DeepL
    let t0 = Date.now();
    const translated = await translateText({
      text,
      sourceLang: "EN",
      targetLang: lang.code.toUpperCase(),
      apiKey: keys.deepl,
      modelType: modelType as DeepLModelType,
    });
    stages.push({ name: "DeepL Translation", output: translated, durationMs: Date.now() - t0 });

    // Stage 2: AI Revision
    let revised = translated;
    if (!skipRevision) {
      t0 = Date.now();
      revised = await reviseTranslation(text, translated, {
        googleApiKey: keys.google,
        targetLanguage,
        targetFileName: "web-input.md",
        chunkSize,
        maxParallel,
      });
      stages.push({ name: "AI Revision (3 passes)", output: revised, durationMs: Date.now() - t0 });
    }

    // Stage 3: Auto-fixes
    let fixed = revised;
    if (!skipAutofix) {
      t0 = Date.now();
      fixed = autofix(fixed, lang.code);
      fixed = insertThousandsSeparators(fixed, lang.code);
      stages.push({ name: "Auto-fixes", output: fixed, durationMs: Date.now() - t0 });
    }

    res.json({ final: fixed, stages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Article import
app.post("/api/import", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }
    const { html } = await fetchPage(url);
    const source = detectSource(url);
    const content = extractContent(html, source);
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Batch: list source files in a directory
app.post("/api/batch/discover", async (req, res) => {
  try {
    const { directory } = req.body;
    if (!directory) return res.status(400).json({ error: "directory is required" });
    const files = await discoverFiles(directory);
    res.json({ files, count: files.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Batch: translate all files (returns final result, not streaming)
app.post("/api/batch/run", async (req, res) => {
  try {
    const { directory, targetLanguage, outputDir, modelType, skipRevision, skipAutofix } = req.body;
    if (!directory || !targetLanguage) {
      return res.status(400).json({ error: "directory and targetLanguage are required" });
    }
    const { runBatch } = await import("./batch/runner.js");
    const result = await runBatch({
      sourceDir: directory,
      targetLanguage,
      outputDir,
      deeplModelType: modelType,
      skipRevision,
      skipAutofix,
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Health / key check
app.get("/api/health", async (_req, res) => {
  try {
    const keys = await getKeys();
    res.json({
      ok: true,
      hasDeepL: !!keys.deepl,
      hasGoogle: !!keys.google,
    });
  } catch (err: any) {
    res.json({ ok: false, error: err.message });
  }
});

const PORT = parseInt(process.env.PORT ?? "3050", 10);
app.listen(PORT, () => {
  console.log(`tlon-translate server running at http://localhost:${PORT}`);
});

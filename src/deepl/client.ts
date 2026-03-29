import {
  type DeepLModelType,
  preprocessText,
  postprocessText,
} from "./newline-workaround.js";

function getDeeplBaseUrl(apiKey: string): string {
  return apiKey.endsWith(":fx")
    ? "https://api-free.deepl.com/v2"
    : "https://api.deepl.com/v2";
}

export interface TranslateOptions {
  text: string;
  sourceLang: string;
  targetLang: string;
  apiKey: string;
  modelType: DeepLModelType;
  glossaryId?: string;
}

export async function translateText(opts: TranslateOptions): Promise<string> {
  const processedText = preprocessText(opts.text, opts.modelType);
  const body: Record<string, string | string[]> = {
    text: [processedText],
    source_lang: opts.sourceLang,
    target_lang: opts.targetLang,
    model_type: opts.modelType,
  };
  if (opts.glossaryId) {
    body.glossary_id = opts.glossaryId;
  }
  const baseUrl = getDeeplBaseUrl(opts.apiKey);
  const response = await fetch(`${baseUrl}/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${opts.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `DeepL API error ${response.status} ${response.statusText}: ${errText}`
    );
  }
  const data = (await response.json()) as {
    translations: Array<{ text: string }>;
  };
  const rawTranslation = data.translations[0].text;
  return postprocessText(rawTranslation, opts.modelType);
}

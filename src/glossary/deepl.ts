const DEEPL_BASE_URL = "https://api.deepl.com/v2";

export interface DeepLGlossary {
  glossary_id: string;
  name: string;
  source_lang: string;
  target_lang: string;
  entry_count: number;
}

export async function listGlossaries(apiKey: string): Promise<DeepLGlossary[]> {
  const res = await fetch(`${DEEPL_BASE_URL}/glossaries`, {
    headers: { Authorization: `DeepL-Auth-Key ${apiKey}` },
  });
  if (!res.ok) throw new Error(`DeepL glossary list failed: ${res.status}`);
  const data = (await res.json()) as { glossaries: DeepLGlossary[] };
  return data.glossaries;
}

export async function createGlossary(
  apiKey: string,
  name: string,
  sourceLang: string,
  targetLang: string,
  entriesTsv: string
): Promise<DeepLGlossary> {
  const res = await fetch(`${DEEPL_BASE_URL}/glossaries`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      source_lang: sourceLang,
      target_lang: targetLang,
      entries: entriesTsv,
      entries_format: "tsv",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepL glossary create failed: ${res.status} ${err}`);
  }
  return (await res.json()) as DeepLGlossary;
}

export async function deleteGlossary(
  apiKey: string,
  glossaryId: string
): Promise<void> {
  const res = await fetch(`${DEEPL_BASE_URL}/glossaries/${glossaryId}`, {
    method: "DELETE",
    headers: { Authorization: `DeepL-Auth-Key ${apiKey}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`DeepL glossary delete failed: ${res.status}`);
  }
}

export async function findGlossary(
  apiKey: string,
  sourceLang: string,
  targetLang: string
): Promise<DeepLGlossary | undefined> {
  const glossaries = await listGlossaries(apiKey);
  return glossaries.find(
    (g) =>
      g.source_lang.toLowerCase() === sourceLang.toLowerCase() &&
      g.target_lang.toLowerCase() === targetLang.toLowerCase()
  );
}

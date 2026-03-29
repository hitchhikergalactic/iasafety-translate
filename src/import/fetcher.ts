// src/import/fetcher.ts

export interface FetchResult {
  html: string;
  url: string;
}

export async function fetchPage(url: string): Promise<FetchResult> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "tlon-translate/0.1 (article importer)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText} for ${url}`);
  }

  const html = await response.text();
  return { html, url: response.url ?? url };
}

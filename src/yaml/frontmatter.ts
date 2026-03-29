// src/yaml/frontmatter.ts
import { parse as yamlParse, stringify as yamlStringify } from "yaml";

export const YAML_DELIMITER = "---\n";

export const ARTICLE_KEYS = [
  "title", "authors", "translators", "tags", "date", "original_path",
  "original_key", "translation_key", "publication_status", "description",
  "html_title", "key", "meta", "snippet",
] as const;

export const TAG_KEYS = [
  "title", "brief_title", "original_path", "publication_status", "html_title",
] as const;

export const AUTHOR_KEYS = [
  "title", "original_path", "publication_status", "html_title",
] as const;

export const COLLECTION_KEYS = [
  "title", "original_path", "publication_status", "html_title",
] as const;

export const PUBLICATION_STATUSES = ["unpublished", "test", "production"] as const;

const KEYS_BY_TYPE: Record<string, readonly string[]> = {
  article: ARTICLE_KEYS,
  tag: TAG_KEYS,
  author: AUTHOR_KEYS,
  collection: COLLECTION_KEYS,
};

export interface DocumentParts {
  frontmatter: string | null;
  body: string;
}

export function splitDocument(doc: string): DocumentParts {
  if (!doc.startsWith("---\n")) {
    return { frontmatter: null, body: doc };
  }
  const end = doc.indexOf("\n---\n", 3);
  if (end === -1) {
    return { frontmatter: null, body: doc };
  }
  return {
    frontmatter: doc.slice(4, end),
    body: doc.slice(end + 5),
  };
}

export function parseFrontmatter(raw: string): Record<string, unknown> {
  if (!raw || raw.trim() === "") return {};
  return (yamlParse(raw) as Record<string, unknown>) ?? {};
}

export function serializeFrontmatter(meta: Record<string, unknown>): string {
  return yamlStringify(meta, { lineWidth: 0 }).trimEnd();
}

/** Reassemble a full document from metadata and body. */
export function assembleDocument(
  meta: Record<string, unknown>,
  body: string
): string {
  const yamlStr = serializeFrontmatter(meta);
  return `---\n${yamlStr}\n---\n${body}`;
}

/** Validate metadata fields against allowed keys for a content type.
 *  Returns a list of error messages (empty = valid). */
export function validateFields(
  meta: Record<string, unknown>,
  type: string
): string[] {
  const allowed = KEYS_BY_TYPE[type];
  if (!allowed) return [`Unknown content type: "${type}"`];

  const errors: string[] = [];
  for (const key of Object.keys(meta)) {
    if (!allowed.includes(key)) {
      errors.push(`Unknown field "${key}" for type "${type}"`);
    }
  }

  const status = meta.publication_status;
  if (
    status !== undefined &&
    typeof status === "string" &&
    !(PUBLICATION_STATUSES as readonly string[]).includes(status)
  ) {
    errors.push(
      `Invalid publication_status "${status}". Must be one of: ${PUBLICATION_STATUSES.join(", ")}`
    );
  }

  return errors;
}

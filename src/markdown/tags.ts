// src/markdown/tags.ts

/** MDX custom tags. Ported from tlon-tag-specs where :type is mdx. */
export const MDX_TAGS = [
  "AlternativeVoice", "Aside", "Cite", "Embedded", "Figure",
  "Footnote", "Language", "LiteralLink", "Math", "ReplaceAudio",
  "Roman", "Sidenote", "SimpleTable", "SmallCaps", "VisuallyHidden", "VoiceRole",
] as const;

/** SSML tags. Ported from tlon-tag-specs where :type is ssml. */
export const SSML_TAGS = [
  "break", "emphasis", "lang", "phoneme", "say-as", "voice",
] as const;

/** HTML tags used in content. Ported from tlon-tag-specs where :type is html. */
export const HTML_TAGS = ["sub", "sup", "q"] as const;

/** All custom tags as a flat array. */
export const ALL_TAGS: readonly string[] = [...MDX_TAGS, ...SSML_TAGS, ...HTML_TAGS];

/** Returns a formatted string listing all custom tags (for use in prompts). */
export function getTagList(): string {
  return ALL_TAGS.map((t) => `<${t}>`).join(", ");
}

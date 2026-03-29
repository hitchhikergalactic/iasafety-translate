// src/import/extractors.ts

export type SourceType = "ea-forum" | "80k-hours" | "generic";

export interface ExtractedContent {
  title: string;
  body: string;
  source: SourceType;
}

export function detectSource(url: string): SourceType {
  if (/forum\.effectivealtruism\.org/.test(url)) return "ea-forum";
  if (/80000hours\.org/.test(url)) return "80k-hours";
  return "generic";
}

export function extractContent(html: string, source: SourceType): ExtractedContent {
  const cleaned = stripScriptsAndStyles(html);

  let title: string;
  let rawBody: string;

  switch (source) {
    case "ea-forum":
      title = matchFirst(cleaned, /class="PostsPageTitle-root"[^>]*>([^<]+)</) ?? extractTitle(cleaned);
      rawBody = matchBlock(cleaned, /class="PostsPage-postContent"/) ?? extractMainContent(cleaned);
      break;
    case "80k-hours":
      title = extractTitle(cleaned);
      rawBody = matchBlock(cleaned, /<article[\s>]/) ?? extractMainContent(cleaned);
      break;
    default:
      title = extractTitle(cleaned);
      rawBody = extractMainContent(cleaned);
  }

  return { title: title.trim(), body: htmlToMarkdown(rawBody), source };
}

function stripScriptsAndStyles(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
}

function extractTitle(html: string): string {
  return matchFirst(html, /<h1[^>]*>([^<]+)</) ??
    matchFirst(html, /<title[^>]*>([^<]+)</) ??
    "Untitled";
}

function extractMainContent(html: string): string {
  return matchBlock(html, /<main[\s>]/) ??
    matchBlock(html, /<article[\s>]/) ??
    matchBlock(html, /<body[\s>]/) ??
    html;
}

function matchFirst(html: string, regex: RegExp): string | undefined {
  const m = html.match(regex);
  return m?.[1];
}

function matchBlock(html: string, openTagRegex: RegExp): string | undefined {
  const m = html.match(openTagRegex);
  if (!m || m.index === undefined) return undefined;
  const tagMatch = html.slice(m.index).match(/^<(\w+)/);
  if (!tagMatch) return undefined;
  const tagName = tagMatch[1];
  const start = html.indexOf(">", m.index) + 1;
  // Track nesting depth to handle nested tags of the same type
  const openTag = new RegExp(`<${tagName}[\\s>]`, "gi");
  const closeTag = `</${tagName}>`;
  let depth = 1;
  let pos = start;
  while (depth > 0 && pos < html.length) {
    const nextOpen = html.slice(pos).search(openTag);
    const nextClose = html.indexOf(closeTag, pos);
    if (nextClose === -1) return html.slice(start);
    if (nextOpen !== -1 && pos + nextOpen < nextClose) {
      depth++;
      pos = pos + nextOpen + 1;
    } else {
      depth--;
      if (depth === 0) return html.slice(start, nextClose);
      pos = nextClose + closeTag.length;
    }
  }
  return html.slice(start);
}

function htmlToMarkdown(html: string): string {
  let md = html;
  // Headings
  md = md.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, level, text) => {
    return "\n" + "#".repeat(Number(level)) + " " + stripTags(text).trim() + "\n";
  });
  // Bold
  md = md.replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, (_m, _tag, text) => `**${text}**`);
  // Italic
  md = md.replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, (_m, _tag, text) => `*${text}*`);
  // Links
  md = md.replace(/<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, text) => `[${stripTags(text)}](${href})`);
  // List items
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, text) => `- ${stripTags(text).trim()}\n`);
  // Remove list wrappers
  md = md.replace(/<\/?(ul|ol)[^>]*>/gi, "\n");
  // Paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_m, text) => `\n${text.trim()}\n`);
  // Line breaks
  md = md.replace(/<br\s*\/?>/gi, "\n");
  // Strip remaining tags
  md = stripTags(md);
  // Collapse whitespace
  md = md.replace(/\n{3,}/g, "\n\n").trim();
  return md;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

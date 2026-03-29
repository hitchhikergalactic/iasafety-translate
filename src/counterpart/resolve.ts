import { join, basename, dirname } from "path";

export interface CounterpartOptions {
  filePath: string;
  originalPath: string;
  bareDirMap: Record<string, string>;
  originalsRoot: string;
}

export function resolveCounterpart(opts: CounterpartOptions): string {
  const dir = dirname(opts.filePath);
  const bareDirName = basename(dir);
  const englishBareDirName = opts.bareDirMap[bareDirName] ?? bareDirName;
  return join(opts.originalsRoot, englishBareDirName, opts.originalPath);
}

const CUR_DIR_PATTERN = /^(\.\/[^#)\s/]+)(#[^)\s]*)?$/;
const PARENT_DIR_PATTERN = /^(\.\.\/[^/]+\/[^#)\s]+)(#[^)\s]*)?$/;

export function translateRelativeLink(
  link: string,
  targetLang: string,
  resolver: (filename: string) => string | null
): string {
  const curMatch = link.match(CUR_DIR_PATTERN);
  if (curMatch) {
    const [, filePart, anchor] = curMatch;
    const filename = basename(filePart);
    const resolved = resolver(filename);
    if (!resolved) return link;
    return "./" + basename(resolved) + (anchor ?? "");
  }
  const parentMatch = link.match(PARENT_DIR_PATTERN);
  if (parentMatch) {
    const [, filePart, anchor] = parentMatch;
    const filename = basename(filePart);
    const resolved = resolver(filename);
    if (!resolved) return link;
    const parentDir = dirname(resolved);
    return "../" + basename(parentDir) + "/" + basename(resolved) + (anchor ?? "");
  }
  return link;
}

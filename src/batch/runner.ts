// src/batch/runner.ts
import { readdir } from "fs/promises";
import { join } from "path";
import { translateFile, type PipelineOptions, type PipelineResult } from "../pipeline.js";
import type { DeepLModelType } from "../deepl/newline-workaround.js";

export interface BatchOptions {
  sourceDir: string;
  targetLanguage: string;
  outputDir?: string;
  deeplModelType?: DeepLModelType;
  chunkSize?: number;
  maxParallel?: number;
  skipRevision?: boolean;
  skipAutofix?: boolean;
  concurrency?: number;
}

export interface BatchProgress {
  total: number;
  completed: number;
  current: string;
  results: Array<{ file: string; status: "done" | "error"; error?: string; outputFile?: string }>;
}

export type ProgressCallback = (progress: BatchProgress) => void;

/** Filter filenames to just source .md files (not translations like *.es.md) */
export function filterSourceFiles(filenames: string[]): string[] {
  const translationPattern = /\.[a-z]{2}\.md$/;
  return filenames.filter((f) => f.endsWith(".md") && !translationPattern.test(f));
}

/** Discover source markdown files in a directory (non-recursive). */
export async function discoverFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const names = entries.filter((e) => e.isFile()).map((e) => e.name);
  return filterSourceFiles(names).map((name) => join(dir, name));
}

/** Run the translation pipeline on all source files in a directory. */
export async function runBatch(
  opts: BatchOptions,
  onProgress?: ProgressCallback,
): Promise<BatchProgress> {
  const files = await discoverFiles(opts.sourceDir);
  const concurrency = opts.concurrency ?? 1;

  const progress: BatchProgress = {
    total: files.length,
    completed: 0,
    current: "",
    results: [],
  };

  const queue = [...files];

  async function processNext(): Promise<void> {
    while (queue.length > 0) {
      const file = queue.shift()!;
      progress.current = file;
      onProgress?.(structuredClone(progress));

      try {
        const pipelineOpts: PipelineOptions = {
          sourceFile: file,
          targetLanguage: opts.targetLanguage,
          outputFile: opts.outputDir
            ? join(opts.outputDir, file.split("/").pop()!.replace(/\.md$/, `.${opts.targetLanguage}.md`))
            : undefined,
          deeplModelType: opts.deeplModelType,
          chunkSize: opts.chunkSize,
          maxParallel: opts.maxParallel,
          skipRevision: opts.skipRevision,
          skipAutofix: opts.skipAutofix,
        };
        const result = await translateFile(pipelineOpts);
        progress.results.push({ file, status: "done", outputFile: result.outputFile });
      } catch (err: any) {
        progress.results.push({ file, status: "error", error: err.message });
      }
      progress.completed++;
      onProgress?.(structuredClone(progress));
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, files.length) }, () => processNext());
  await Promise.all(workers);

  return progress;
}

// test/batch/runner.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { filterSourceFiles, discoverFiles } from "../../src/batch/runner.js";

describe("filterSourceFiles", () => {
  it("excludes non-.md files", () => {
    expect(filterSourceFiles(["article.md", "readme.txt", "data.json"])).toEqual(["article.md"]);
  });
  it("excludes translation files (*.xx.md pattern)", () => {
    expect(filterSourceFiles(["post.md", "post.es.md", "post.fr.md"])).toEqual(["post.md"]);
  });
  it("returns empty for no source files", () => {
    expect(filterSourceFiles(["only.es.md"])).toEqual([]);
  });
});

describe("discoverFiles", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "batch-test-"));
    await writeFile(join(tmpDir, "article1.md"), "# Article 1");
    await writeFile(join(tmpDir, "article2.md"), "# Article 2");
    await writeFile(join(tmpDir, "article1.es.md"), "# Artículo 1");
    await writeFile(join(tmpDir, "readme.txt"), "Not markdown");
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  it("finds source .md files and excludes translations and non-.md files", async () => {
    const files = await discoverFiles(tmpDir);
    const names = files.map((f) => f.split("/").pop()).sort();
    expect(names).toEqual(["article1.md", "article2.md"]);
  });

  it("returns full paths", async () => {
    const files = await discoverFiles(tmpDir);
    for (const f of files) {
      expect(f).toContain(tmpDir);
    }
  });
});

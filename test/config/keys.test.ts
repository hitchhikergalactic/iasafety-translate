import { describe, it, expect, vi, afterEach } from "vitest";
import { readFile } from "fs/promises";
import { loadKeys, getKey, _resetKeysCache } from "../../src/config/keys.js";

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
}));

describe("loadKeys", () => {
  afterEach(() => { _resetKeysCache(); vi.restoreAllMocks(); });

  it("parses keys from JSON file", async () => {
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ deepl: "dk_test", google: "gk_test" })
    );
    const keys = await loadKeys();
    expect(keys.deepl).toBe("dk_test");
    expect(keys.google).toBe("gk_test");
  });

  it("throws on missing file with helpful message", async () => {
    vi.mocked(readFile).mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" })
    );
    await expect(loadKeys()).rejects.toThrow("~/.config/tlon/keys.json");
  });
});

describe("getKey", () => {
  afterEach(() => { _resetKeysCache(); vi.restoreAllMocks(); });

  it("returns key after loading", async () => {
    vi.mocked(readFile).mockResolvedValue(
      JSON.stringify({ deepl: "dk_abc" })
    );
    const key = await getKey("deepl");
    expect(key).toBe("dk_abc");
  });

  it("throws for unknown key name", async () => {
    vi.mocked(readFile).mockResolvedValue(JSON.stringify({ deepl: "x" }));
    await expect(getKey("nonexistent" as any)).rejects.toThrow("nonexistent");
  });
});

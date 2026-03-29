import { describe, it, expect, vi, afterEach } from "vitest";
import { readFile } from "fs/promises";
import { loadKeys, getKey, _resetKeysCache } from "../../src/config/keys.js";

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
}));

describe("loadKeys", () => {
  afterEach(() => { _resetKeysCache(); vi.restoreAllMocks(); });

  it("parses keys from .env file", async () => {
    vi.mocked(readFile).mockResolvedValue(
      "DEEPL_API_KEY=dk_test\nGEMINI_API_KEY=gk_test"
    );
    const keys = await loadKeys();
    expect(keys.deepl).toBe("dk_test");
    expect(keys.google).toBe("gk_test");
  });

  it("throws on missing file with helpful message", async () => {
    vi.mocked(readFile).mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" })
    );
    await expect(loadKeys()).rejects.toThrow("Credentials file not found");
  });
});

describe("getKey", () => {
  afterEach(() => { _resetKeysCache(); vi.restoreAllMocks(); });

  it("returns key after loading", async () => {
    vi.mocked(readFile).mockResolvedValue(
      "DEEPL_API_KEY=dk_abc\nGEMINI_API_KEY=gk_xyz"
    );
    const key = await getKey("deepl");
    expect(key).toBe("dk_abc");
  });

  it("throws for missing key", async () => {
    vi.mocked(readFile).mockResolvedValue("DEEPL_API_KEY=x");
    await expect(getKey("google")).rejects.toThrow("google");
  });
});

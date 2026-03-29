import { describe, it, expect, vi, beforeEach } from "vitest";
import { translateText } from "../../src/deepl/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("translateText", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("sends correct request to DeepL API", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ translations: [{ text: "Hola mundo" }] }),
    });
    const result = await translateText({
      text: "Hello world",
      sourceLang: "EN",
      targetLang: "ES",
      apiKey: "test-key",
      modelType: "latency_optimized",
    });
    expect(result).toBe("Hola mundo");
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.deepl.com/v2/translate");
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body);
    expect(body.text).toBe("Hello world");
    expect(body.source_lang).toBe("EN");
    expect(body.target_lang).toBe("ES");
    expect(body.model_type).toBe("latency_optimized");
  });

  it("includes glossary_id when provided", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ translations: [{ text: "Hola" }] }),
    });
    await translateText({
      text: "Hello",
      sourceLang: "EN",
      targetLang: "ES",
      apiKey: "key",
      modelType: "latency_optimized",
      glossaryId: "gloss-123",
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.glossary_id).toBe("gloss-123");
  });

  it("applies newline workaround for quality_optimized", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        translations: [{ text: "línea1Nihil igitur mors est ad nos.línea2" }],
      }),
    });
    const result = await translateText({
      text: "line1\nline2",
      sourceLang: "EN",
      targetLang: "ES",
      apiKey: "key",
      modelType: "quality_optimized",
    });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).not.toContain("\n");
    expect(result).toContain("\n");
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      text: async () => "Invalid auth key",
    });
    await expect(
      translateText({
        text: "Hello",
        sourceLang: "EN",
        targetLang: "ES",
        apiKey: "bad-key",
        modelType: "latency_optimized",
      })
    ).rejects.toThrow("403");
  });
});

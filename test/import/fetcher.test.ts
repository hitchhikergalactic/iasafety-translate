// test/import/fetcher.test.ts
import { describe, it, expect, vi } from "vitest";
import { fetchPage } from "../../src/import/fetcher.js";

describe("fetchPage", () => {
  it("fetches HTML from a URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("<html><body>Hello</body></html>"),
      headers: new Headers({ "content-type": "text/html" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchPage("https://example.com/article");
    expect(result.html).toContain("Hello");
    expect(result.url).toBe("https://example.com/article");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/article",
      expect.objectContaining({ headers: expect.any(Object) })
    );

    vi.unstubAllGlobals();
  });

  it("throws on non-OK response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });
    vi.stubGlobal("fetch", mockFetch);

    await expect(fetchPage("https://example.com/missing")).rejects.toThrow("404");

    vi.unstubAllGlobals();
  });

  it("follows redirects by default", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      url: "https://example.com/final",
      text: () => Promise.resolve("<html><body>Redirected</body></html>"),
      headers: new Headers({ "content-type": "text/html" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchPage("https://example.com/redirect");
    expect(result.html).toContain("Redirected");

    vi.unstubAllGlobals();
  });
});

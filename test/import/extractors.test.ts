// test/import/extractors.test.ts
import { describe, it, expect } from "vitest";
import { extractContent, detectSource } from "../../src/import/extractors.js";

describe("detectSource", () => {
  it("detects EA Forum URLs", () => {
    expect(detectSource("https://forum.effectivealtruism.org/posts/abc/some-post")).toBe("ea-forum");
  });
  it("detects 80K Hours URLs", () => {
    expect(detectSource("https://80000hours.org/articles/some-article/")).toBe("80k-hours");
  });
  it("returns generic for unknown URLs", () => {
    expect(detectSource("https://example.com/article")).toBe("generic");
  });
});

describe("extractContent", () => {
  it("extracts title and body from EA Forum HTML", () => {
    const html = `
      <html><body>
        <h1 class="PostsPageTitle-root">My Post Title</h1>
        <div class="PostsPage-postContent"><p>First paragraph.</p><p>Second paragraph.</p></div>
      </body></html>
    `;
    const result = extractContent(html, "ea-forum");
    expect(result.title).toBe("My Post Title");
    expect(result.body).toContain("First paragraph.");
    expect(result.body).toContain("Second paragraph.");
  });

  it("extracts title and body from 80K Hours HTML", () => {
    const html = `
      <html><body>
        <h1>Career Guide Title</h1>
        <article><p>Intro paragraph.</p><h2>Section</h2><p>Details here.</p></article>
      </body></html>
    `;
    const result = extractContent(html, "80k-hours");
    expect(result.title).toBe("Career Guide Title");
    expect(result.body).toContain("Intro paragraph.");
  });

  it("uses generic extraction for unknown sites", () => {
    const html = `
      <html><head><title>Page Title</title></head>
      <body><main><p>Main content here.</p></main></body></html>
    `;
    const result = extractContent(html, "generic");
    expect(result.title).toBe("Page Title");
    expect(result.body).toContain("Main content here.");
  });

  it("converts basic HTML tags to markdown", () => {
    const html = `
      <html><body><article>
        <h1>Title</h1>
        <h2>Subtitle</h2>
        <p>A paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
        <ul><li>Item 1</li><li>Item 2</li></ul>
        <a href="https://example.com">A link</a>
      </article></body></html>
    `;
    const result = extractContent(html, "generic");
    expect(result.body).toContain("## Subtitle");
    expect(result.body).toContain("**bold**");
    expect(result.body).toContain("*italic*");
    expect(result.body).toContain("- Item 1");
    expect(result.body).toContain("[A link](https://example.com)");
  });

  it("strips script and style tags", () => {
    const html = `
      <html><body><main>
        <script>alert('xss')</script>
        <style>.foo { color: red; }</style>
        <p>Clean content.</p>
      </main></body></html>
    `;
    const result = extractContent(html, "generic");
    expect(result.body).not.toContain("alert");
    expect(result.body).not.toContain("color");
    expect(result.body).toContain("Clean content.");
  });
});

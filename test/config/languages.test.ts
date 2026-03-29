// test/config/languages.test.ts
import { describe, it, expect } from "vitest";
import {
  getLanguageByCode,
  getLanguageByName,
  PROJECT_LANGUAGES,
  TARGET_LANGUAGES,
  getThousandsSeparator,
  getDecimalSeparator,
  getBareDir,
  getFigureName,
  getImageDir,
} from "../../src/config/languages.js";

describe("language lookups", () => {
  it("finds Spanish by code", () => {
    const lang = getLanguageByCode("es");
    expect(lang).toBeDefined();
    expect(lang!.name).toBe("spanish");
  });

  it("finds French by name", () => {
    const lang = getLanguageByName("french");
    expect(lang).toBeDefined();
    expect(lang!.code).toBe("fr");
  });

  it("returns undefined for unknown code", () => {
    expect(getLanguageByCode("zz")).toBeUndefined();
  });
});

describe("PROJECT_LANGUAGES", () => {
  it("includes english", () => {
    expect(PROJECT_LANGUAGES).toContain("english");
  });

  it("has 12 languages", () => {
    expect(PROJECT_LANGUAGES).toHaveLength(12);
  });
});

describe("TARGET_LANGUAGES", () => {
  it("excludes english", () => {
    expect(TARGET_LANGUAGES).not.toContain("english");
  });

  it("has 11 languages", () => {
    expect(TARGET_LANGUAGES).toHaveLength(11);
  });
});

describe("separators", () => {
  it("returns comma for English thousands", () => {
    expect(getThousandsSeparator("en")).toBe(",");
  });

  it("returns period for French decimal", () => {
    expect(getDecimalSeparator("fr")).toBe(",");
  });

  it("returns narrow no-break space for Spanish thousands", () => {
    expect(getThousandsSeparator("es")).toBe("\u202F");
  });
});

describe("bare dirs", () => {
  it("returns 'artículos' for Spanish articles", () => {
    expect(getBareDir("es", "articles")).toBeDefined();
  });

  it("returns 'sujets' for French tags", () => {
    expect(getBareDir("fr", "tags")).toBe("sujets");
  });
});

describe("figure names", () => {
  it("returns 'figura' for Spanish", () => {
    expect(getFigureName("es")).toBe("figura");
  });
});

describe("image dirs", () => {
  it("returns 'imágenes' for Spanish", () => {
    expect(getImageDir("es")).toBeDefined();
  });
});

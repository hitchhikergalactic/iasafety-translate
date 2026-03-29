// src/config/languages.ts

export interface LanguageProperties {
  name: string;
  standard: string;
  code: string;
  locale: string;
  iso6392?: string;
}

/** All known languages with their properties (ported from tlon-languages-properties). */
export const LANGUAGES: LanguageProperties[] = [
  { name: "arabic", standard: "arabic", code: "ar", locale: "ar_SA", iso6392: "ara" },
  { name: "chinese", standard: "chinese", code: "zh", locale: "zh_CN", iso6392: "zho" },
  { name: "english", standard: "english", code: "en", locale: "en_US", iso6392: "eng" },
  { name: "french", standard: "french", code: "fr", locale: "fr_FR", iso6392: "fra" },
  { name: "german", standard: "german", code: "de", locale: "de_DE", iso6392: "deu" },
  { name: "italian", standard: "italian", code: "it", locale: "it_IT", iso6392: "ita" },
  { name: "japanese", standard: "japanese", code: "ja", locale: "ja_JP", iso6392: "jpn" },
  { name: "korean", standard: "korean", code: "ko", locale: "ko_KR", iso6392: "kor" },
  { name: "polish", standard: "polish", code: "pl", locale: "pl_PL", iso6392: "pol" },
  { name: "russian", standard: "russian", code: "ru", locale: "ru_RU", iso6392: "rus" },
  { name: "serbian", standard: "serbian", code: "sr", locale: "sr_RS", iso6392: "srp" },
  { name: "spanish", standard: "spanish", code: "es", locale: "es_ES", iso6392: "spa" },
  { name: "turkish", standard: "turkish", code: "tr", locale: "tr_TR", iso6392: "tur" },
];

export const PROJECT_LANGUAGES = [
  "arabic", "chinese", "english", "french", "italian",
  "japanese", "korean", "polish", "russian", "serbian", "spanish", "turkish",
];

export const TARGET_LANGUAGES = PROJECT_LANGUAGES.filter((l) => l !== "english");

export function getLanguageByCode(code: string): LanguageProperties | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

export function getLanguageByName(name: string): LanguageProperties | undefined {
  return LANGUAGES.find((l) => l.name === name);
}

/** Thousands/decimal separators by language code. Ported from tlon-language-separators.
 *  Note: ar/es/fr/ru use narrow no-break space U+202F in the Emacs source. */
const SEPARATORS: Record<string, { thousands: string; decimal: string }> = {
  ar: { thousands: "\u202F", decimal: "." },
  de: { thousands: ".", decimal: "," },
  en: { thousands: ",", decimal: "." },
  es: { thousands: "\u202F", decimal: "," },
  fr: { thousands: "\u202F", decimal: "," },
  it: { thousands: ".", decimal: "," },
  ja: { thousands: ",", decimal: "." },
  ko: { thousands: ",", decimal: "." },
  ru: { thousands: "\u202F", decimal: "," },
  tr: { thousands: ".", decimal: "," },
};

export function getThousandsSeparator(code: string): string | undefined {
  return SEPARATORS[code]?.thousands;
}

export function getDecimalSeparator(code: string): string | undefined {
  return SEPARATORS[code]?.decimal;
}

/** Bare directory names per language and category. Ported from tlon-core-bare-dirs. */
const BARE_DIRS: Record<string, Record<string, string>> = {
  articles: {
    ar: "مجلات", en: "articles", es: "articulos", fr: "articles",
    it: "articoli", ja: "記事", ko: "기사", ru: "статьи", tr: "makaleler", zh: "文章",
  },
  tags: {
    ar: "الأوسمة", en: "tags", es: "temas", fr: "sujets",
    it: "soggetti", ja: "タグ", ko: "태그", ru: "теги", tr: "etiketler", zh: "标签",
  },
  authors: {
    ar: "المؤلفون", en: "authors", es: "autores", fr: "auteurs",
    it: "autori", ja: "著者", ko: "저자", ru: "авторы", tr: "yazarlar", zh: "作者",
  },
  collections: {
    ar: "مجموعات", en: "collections", es: "colecciones", fr: "collections",
    it: "collezioni", ja: "コレクション", ko: "컬렉션", ru: "коллекции", tr: "koleksiyonlar", zh: "合集",
  },
};

export function getBareDir(langCode: string, category: string): string | undefined {
  return BARE_DIRS[category]?.[langCode];
}

/** Figure label names per language. Ported from tlon-figure-names. */
const FIGURE_NAMES: Record<string, string> = {
  ar: "شكل", de: "abbildung", en: "figure", es: "figura",
  fr: "figure", it: "figura", ja: "図", ko: "그림", ru: "рисунок", tr: "şekil",
};

export function getFigureName(code: string): string | undefined {
  return FIGURE_NAMES[code];
}

/** Image directory names per language. Ported from tlon-image-dirs. */
const IMAGE_DIRS: Record<string, string> = {
  ar: "صور", de: "bilder", en: "images", es: "imagenes",
  fr: "images", it: "immagini", ja: "画像", ko: "이미지", ru: "изображения", tr: "resimler",
};

export function getImageDir(code: string): string | undefined {
  return IMAGE_DIRS[code];
}

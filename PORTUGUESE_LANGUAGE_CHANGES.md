# Adding Portuguese as a Supported Language

## Summary

Portuguese (pt) has been added as a supported language in ea-translate. This includes full integration with the translation pipeline, DeepL machine translation, and the web UI.

## Files Changed

### `src/config/languages.ts`

This is the central language configuration file. The following additions were made:

- **LANGUAGES array**: Added `{ name: "portuguese", standard: "portuguese", code: "pt", locale: "pt_PT", iso6392: "por" }`
- **PROJECT_LANGUAGES array**: Added `"portuguese"` to the list (now 13 languages total)
- **SEPARATORS**: Added `pt: { thousands: ".", decimal: "," }` — Portuguese uses periods for thousands and commas for decimals
- **BARE_DIRS**: Added Portuguese translations for all four directory categories:
  - articles → `artigos`
  - tags → `etiquetas`
  - authors → `autores`
  - collections → `colecoes`
- **FIGURE_NAMES**: Added `pt: "figura"`
- **IMAGE_DIRS**: Added `pt: "imagens"`

### `public/index.html`

The web frontend has two hardcoded language structures:

- **LANG_CODE_MAP**: Added `portuguese:'pt'` — maps language name to ISO code for API calls
- **codes array**: Added `'pt'` — populates the auto-fix language code dropdown

### `test/config/languages.test.ts`

Updated count assertions to reflect the new language:

- `PROJECT_LANGUAGES` length: 12 → 13
- `TARGET_LANGUAGES` length: 11 → 12

## Files That Did NOT Need Changes

These files work dynamically and automatically pick up the new language:

- `src/pipeline.ts` — uses `getLanguageByName()` to resolve languages
- `src/server.ts` and `api/index.ts` — expose `PROJECT_LANGUAGES` via `/api/languages` endpoint
- `src/deepl/client.ts` — DeepL natively supports Portuguese (`PT`)
- `src/fix/rules.ts` — no Portuguese-specific typography rules were added (can be added later if needed)

# EA Translate

Web-based translation pipeline for EA content. Combines DeepL machine translation with Gemini AI revision and language-specific auto-fixes.

**Live:** [ea-translate.vercel.app](https://ea-translate.vercel.app)

## Features

- **DeepL Translation** with newline-preservation workaround for quality mode
- **3-pass AI Revision** via Gemini (error spotting, flow improvement, global review)
- **Auto-fix** for typography, thousands separators, heading hierarchy, and unbalanced characters
- **Article Import** from EA Forum, 80,000 Hours, or any URL
- **Glossary Management** — parse, AI-generate missing translations, filter relevant terms, and sync with DeepL glossaries
- **Batch Processing** for translating entire directories of markdown files
- **Full Pipeline** combining all steps in one click

Supports Arabic, Chinese, French, Italian, Japanese, Korean, Polish, Russian, Serbian, Spanish, and Turkish.

## Setup

```bash
yarn install
```

Create a `.env` file in the project root:

```
DEEPL_API_KEY=your-deepl-key
GEMINI_API_KEY=your-gemini-key
```

## Run locally

```bash
yarn dev
```

Opens on [localhost:3050](http://localhost:3050).

## Deploy

```bash
vercel deploy --prod
```

Add `DEEPL_API_KEY` and `GEMINI_API_KEY` as environment variables in your Vercel project.

## Based on

[tlon.el](https://github.com/tlon-team/tlon.el) — the Emacs-based translation toolkit by Tlon.

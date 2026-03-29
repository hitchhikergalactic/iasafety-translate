import { readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

export interface Keys {
  deepl: string;
  google: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENV_PATH = join(__dirname, "../../.env");

let cached: Keys | null = null;

function parseEnv(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    result[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return result;
}

export async function loadKeys(path: string = ENV_PATH): Promise<Keys> {
  if (cached) return cached;

  // Check process.env first (for Vercel / production deployments)
  if (process.env.DEEPL_API_KEY || process.env.GEMINI_API_KEY) {
    cached = {
      deepl: process.env.DEEPL_API_KEY ?? "",
      google: process.env.GEMINI_API_KEY ?? "",
    };
    return cached;
  }

  let raw: string;
  try {
    raw = await readFile(path, "utf-8");
  } catch (err: any) {
    if (err.code === "ENOENT") {
      throw new Error(
        `Credentials file not found. Create .env in project root with:\n` +
        `DEEPL_API_KEY=your-key\nGEMINI_API_KEY=your-key`
      );
    }
    throw err;
  }
  const env = parseEnv(raw);
  cached = {
    deepl: env.DEEPL_API_KEY ?? "",
    google: env.GEMINI_API_KEY ?? "",
  };
  return cached;
}

export async function getKey(name: keyof Keys): Promise<string> {
  const keys = await loadKeys();
  const val = keys[name];
  if (!val) throw new Error(`Key "${name}" not found in .env`);
  return val;
}

/** Reset cache (for testing). */
export function _resetKeysCache(): void {
  cached = null;
}

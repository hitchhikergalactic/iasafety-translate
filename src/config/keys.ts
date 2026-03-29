import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

export interface Keys {
  deepl: string;
  google: string;
}

const KEY_PATH = join(homedir(), ".config", "tlon", "keys.json");

let cached: Keys | null = null;

export async function loadKeys(path: string = KEY_PATH): Promise<Keys> {
  if (cached) return cached;
  let raw: string;
  try {
    raw = await readFile(path, "utf-8");
  } catch (err: any) {
    if (err.code === "ENOENT") {
      throw new Error(
        `API keys file not found. Create ~/.config/tlon/keys.json with:\n` +
        `{ "deepl": "your-key", "google": "your-key" }`
      );
    }
    throw err;
  }
  cached = JSON.parse(raw) as Keys;
  return cached;
}

export async function getKey(name: keyof Keys): Promise<string> {
  const keys = await loadKeys();
  const val = keys[name];
  if (!val) throw new Error(`Key "${name}" not found in keys.json`);
  return val;
}

/** Reset cache (for testing). */
export function _resetKeysCache(): void {
  cached = null;
}

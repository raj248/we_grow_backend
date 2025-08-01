// utils/cacheManager.ts
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE_PATH = path.resolve(__dirname, '../../cache/meta.json');
// const CACHE_FILE_PATH = '/cache/meta.json';
let lastUpdatedMap: Record<string, number> = {};

// Load existing cache metadata (if exists)
export async function loadCacheMeta() {
  try {
    if (await fs.pathExists(CACHE_FILE_PATH)) {
      lastUpdatedMap = await fs.readJson(CACHE_FILE_PATH);
    }
  } catch {
    lastUpdatedMap = {};
  }
}

// Get last updated time
export function getLastUpdated(routeKey: string): number | undefined {
  return lastUpdatedMap[routeKey];
}

// Set new timestamp and persist to file
export async function setLastUpdated(routeKey: string): Promise<void> {
  lastUpdatedMap[routeKey] = Date.now();
  await fs.outputJson(CACHE_FILE_PATH, lastUpdatedMap, { spaces: 2 });
}

import { api } from './api';

// The container writes /config.json from its environment when it starts (ADR-0003, docker/write-config.sh),
// so one image serves any hostname. Without a usable file, the base URL set in api.ts stays.
export async function loadRuntimeConfig(fetchConfig: typeof fetch = fetch): Promise<void> {
  try {
    const response = await fetchConfig('/config.json', { cache: 'no-store' });
    if (!response.ok) return;
    const config: unknown = await response.json();
    const apiBaseUrl = (config as { apiBaseUrl?: unknown } | null)?.apiBaseUrl;
    if (typeof apiBaseUrl === 'string' && apiBaseUrl.trim()) api.defaults.baseURL = apiBaseUrl.trim();
  } catch {
    // No file in development, or not JSON: keep the default.
  }
}

import { api } from './api';

// apiHost() parses the base URL every time the shell draws, so one the browser cannot parse, such as a typo with a
// space in API_BASE_URL, would blank every page.
function isUrl(value: string): boolean {
  try {
    return new URL(value, window.location.origin).host !== '';
  } catch {
    return false;
  }
}

// The container writes /config.json from its environment when it starts (ADR-0003, docker/write-config.sh),
// so one image serves any hostname. Without a usable file, the base URL set in api.ts stays.
export async function loadRuntimeConfig(fetchConfig: typeof fetch = fetch): Promise<void> {
  try {
    const response = await fetchConfig('/config.json', { cache: 'no-store' });
    if (!response.ok) return;
    const config: unknown = await response.json();
    const apiBaseUrl = (config as { apiBaseUrl?: unknown } | null)?.apiBaseUrl;
    if (typeof apiBaseUrl === 'string' && apiBaseUrl.trim() && isUrl(apiBaseUrl.trim())) api.defaults.baseURL = apiBaseUrl.trim();
  } catch {
    // No file in development, or not JSON: keep the default.
  }
}

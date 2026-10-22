import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { loadRuntimeConfig } from './config';

const DEVELOPMENT_URL = api.defaults.baseURL;

const answering = (status: number, body: string) =>
  vi.fn<typeof fetch>().mockResolvedValue(new Response(body, { status, headers: { 'Content-Type': 'application/json' } }));

describe('loadRuntimeConfig', () => {
  afterEach(() => {
    api.defaults.baseURL = DEVELOPMENT_URL;
  });

  it('starts from VITE_API_URL in development and tests', () => {
    expect(DEVELOPMENT_URL).toBe('http://127.0.0.1:8000');
  });

  it('takes the API base URL from /config.json, asking the browser not to cache it', async () => {
    const fetchConfig = answering(200, '{"apiBaseUrl": "/api"}');

    await loadRuntimeConfig(fetchConfig);

    expect(api.defaults.baseURL).toBe('/api');
    expect(fetchConfig).toHaveBeenCalledWith('/config.json', { cache: 'no-store' });
  });

  it('keeps the default when there is no config.json', async () => {
    await loadRuntimeConfig(answering(404, 'Not found'));

    expect(api.defaults.baseURL).toBe(DEVELOPMENT_URL);
  });

  it('keeps the default when config.json is not JSON, as when a dev server answers index.html', async () => {
    await loadRuntimeConfig(answering(200, '<!doctype html>'));

    expect(api.defaults.baseURL).toBe(DEVELOPMENT_URL);
  });

  it('keeps the default when apiBaseUrl is missing or empty', async () => {
    await loadRuntimeConfig(answering(200, '{"apiBaseUrl": "  "}'));
    await loadRuntimeConfig(answering(200, '{}'));

    expect(api.defaults.baseURL).toBe(DEVELOPMENT_URL);
  });

  it('keeps the default when apiBaseUrl is not a URL, since the shell parses it on every page', async () => {
    await loadRuntimeConfig(answering(200, '{"apiBaseUrl": "http://bad host/api"}'));

    expect(api.defaults.baseURL).toBe(DEVELOPMENT_URL);
  });

  it('takes an API on another origin', async () => {
    await loadRuntimeConfig(answering(200, '{"apiBaseUrl": "https://api.example.org"}'));

    expect(api.defaults.baseURL).toBe('https://api.example.org');
  });

  it('keeps the default when the request fails', async () => {
    await loadRuntimeConfig(vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch')));

    expect(api.defaults.baseURL).toBe(DEVELOPMENT_URL);
  });
});

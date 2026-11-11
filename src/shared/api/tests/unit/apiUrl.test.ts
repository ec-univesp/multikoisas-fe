import { afterEach, describe, expect, it, vi } from 'vitest';

const importApiUrl = async () => {
  vi.resetModules();
  return (await import('../../getFromApi')).API_URL;
};

describe('API_URL', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('uses the address set for the api', async () => {
    vi.stubEnv('MULTIKOISAS_API_URL', 'https://api.exemplo.com');
    expect(await importApiUrl()).toBe('https://api.exemplo.com');
  });

  it('falls back to the api on Render when the variable is left empty, as in .env.example', async () => {
    vi.stubEnv('MULTIKOISAS_API_URL', '');
    expect(await importApiUrl()).toBe('https://multikoisas-univesp.onrender.com');
  });
});

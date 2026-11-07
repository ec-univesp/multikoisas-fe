// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { resolveSessionKey, resolveSessionSecret } from '../../authEnvironment';

describe('resolveSessionSecret', () => {
  it('uses the configured session secret', () => {
    expect(resolveSessionSecret({ NODE_ENV: 'production', SESSION_SECRET: 'x'.repeat(32) })).toBe('x'.repeat(32));
  });

  it('never fills in a secret outside development', () => {
    expect(resolveSessionSecret({ NODE_ENV: 'production' })).toBeUndefined();
  });

  it('provides a stable secret of at least 32 characters in development', () => {
    const first = resolveSessionSecret({ NODE_ENV: 'development' });

    expect(first?.length).toBeGreaterThanOrEqual(32);
    expect(resolveSessionSecret({ NODE_ENV: 'development' })).toBe(first);
  });

  it('keeps a session secret set by the developer', () => {
    expect(
      resolveSessionSecret({ NODE_ENV: 'development', SESSION_SECRET: 'segredo-escolhido-pelo-dev-com-32-chars!' }),
    ).toBe('segredo-escolhido-pelo-dev-com-32-chars!');
  });
});

describe('resolveSessionKey', () => {
  const panel = {
    NODE_ENV: 'production',
    SESSION_SECRET: 'x'.repeat(32),
    PANEL_USERNAME: 'loja',
    PANEL_PASSWORD: 'senha',
  };

  it('ties the session key to the panel account, so changing the password signs everybody out', () => {
    const key = resolveSessionKey(panel);
    expect(key).toEqual(expect.stringContaining('x'.repeat(32)));
    expect(resolveSessionKey({ ...panel, PANEL_PASSWORD: 'outra' })).not.toBe(key);
    expect(resolveSessionKey({ ...panel, PANEL_USERNAME: 'outro' })).not.toBe(key);
  });

  it('ignores spaces around the configured username', () => {
    expect(resolveSessionKey({ ...panel, PANEL_USERNAME: '  loja\n' })).toBe(resolveSessionKey(panel));
  });

  it.each([
    ['a short session secret', { SESSION_SECRET: 'curto' }],
    ['no username', { PANEL_USERNAME: '   ' }],
    ['no password', { PANEL_PASSWORD: '' }],
  ])('has no key with %s', (_case, override) => {
    expect(resolveSessionKey({ ...panel, ...override })).toBeUndefined();
  });
});

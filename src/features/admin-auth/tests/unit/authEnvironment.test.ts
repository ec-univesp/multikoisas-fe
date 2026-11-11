// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { resolveSessionSecret } from '../../authEnvironment';

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

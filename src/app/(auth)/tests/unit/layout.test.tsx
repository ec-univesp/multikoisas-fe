import { describe, expect, it } from 'vitest';
import { LocalApiProvider } from '@/shared/local-api/LocalApiProvider';
import AuthLayout from '../../layout';

describe('AuthLayout', () => {
  it('waits for the local api, which keeps the store logo', () => {
    expect(AuthLayout({ children: <p>login</p> }).type).toBe(LocalApiProvider);
  });
});

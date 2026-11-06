import { describe, expect, it } from 'vitest';
import { LocalApiProvider } from '@/shared/local-api/LocalApiProvider';
import AdminLayout from '../../layout';

describe('AdminLayout', () => {
  it('waits for the local api before showing the panel', () => {
    expect(AdminLayout({ children: <p>painel</p> }).type).toBe(LocalApiProvider);
  });
});

import { describe, expect, it } from 'vitest';
import { SidebarProvider } from '@/context/SidebarContext';
import AdminLayout from '../../layout';

describe('AdminLayout', () => {
  it('shows the panel right away, without waiting for a browser api', () => {
    expect(AdminLayout({ children: <p>painel</p> }).type).toBe(SidebarProvider);
  });
});

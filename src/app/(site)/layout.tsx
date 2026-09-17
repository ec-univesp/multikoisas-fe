import type { Metadata } from 'next';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';

export const metadata: Metadata = {
  title: { default: 'MultiKoisas — Tudo em um só lugar', template: '%s | MultiKoisas' },
  description:
    'Vitrine da MultiKoisas: utilidades para casa, cozinha, limpeza e organização. Veja os detalhes e compre nas nossas lojas parceiras.',
};

const forceLightTheme = `document.documentElement.classList.remove('dark');`;

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <script dangerouslySetInnerHTML={{ __html: forceLightTheme }} />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

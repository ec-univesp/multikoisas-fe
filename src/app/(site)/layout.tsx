import type { Metadata } from 'next';
import { ShowcaseSearchProvider } from '@/features/showcase-filter';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';
import { WhatsAppFloatingButton } from '@/widgets/whatsapp-floating-button';

export const metadata: Metadata = {
  title: { default: 'MultiKoisas — Tudo em um só lugar', template: '%s | MultiKoisas' },
  description:
    'Vitrine da MultiKoisas: utilidades para casa, cozinha, limpeza e organização. Veja os detalhes e compre nas nossas lojas parceiras.',
};

const forceLightTheme = `document.documentElement.classList.remove('dark');`;

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <script dangerouslySetInnerHTML={{ __html: forceLightTheme }} />
      <ShowcaseSearchProvider>
        <SiteHeader />
        <main className="flex-1">{children}</main>
      </ShowcaseSearchProvider>
      <SiteFooter />
      <WhatsAppFloatingButton />
    </div>
  );
}

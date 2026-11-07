import type { Metadata } from 'next';
import { fetchGooglePlace } from '@/entities/google-place';
import { ShowcaseSearchProvider } from '@/features/showcase-filter';
import { LocalApiProvider } from '@/shared/local-api/LocalApiProvider';
import { GoogleReviewsBadge } from '@/widgets/google-reviews-badge';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';
import { WhatsAppFloatingButton } from '@/widgets/whatsapp-floating-button';

export const metadata: Metadata = {
  title: { default: 'MultiKoisas — Tudo em um só lugar', template: '%s | MultiKoisas' },
  description:
    'Vitrine da MultiKoisas: utilidades para casa, cozinha, limpeza e organização. Veja os detalhes e compre nas nossas lojas parceiras.',
};

const forceLightTheme = `document.documentElement.classList.remove('dark');`;

export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const googlePlace = await fetchGooglePlace();
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <script dangerouslySetInnerHTML={{ __html: forceLightTheme }} />
      <LocalApiProvider>
        <ShowcaseSearchProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </ShowcaseSearchProvider>
        <SiteFooter />
        <aside
          aria-label="Contatos da loja"
          className="fixed top-1/2 right-4 z-40 flex -translate-y-1/2 flex-col items-end gap-3"
        >
          <GoogleReviewsBadge livePlace={googlePlace ?? undefined} />
          <WhatsAppFloatingButton />
        </aside>
      </LocalApiProvider>
    </div>
  );
}

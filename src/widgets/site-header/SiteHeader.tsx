import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { fetchProducts, toStoresPhrase, type Product } from '@/entities/product';
import { fetchSocialNetworks, type SocialNetwork } from '@/entities/social-network';
import { VitrineLink, VitrineSearchField } from '@/features/vitrine-filter';
import { BrandMark } from '@/shared/ui/BrandMark';

const loadProducts = (): Promise<Product[]> => fetchProducts().catch(() => []);
const loadSocialNetworks = (): Promise<SocialNetwork[]> => fetchSocialNetworks().catch(() => []);

const WHATSAPP_HOSTS = new Set(['wa.me', 'api.whatsapp.com', 'whatsapp.com']);

const isWhatsApp = (socialNetwork: SocialNetwork): boolean =>
  WHATSAPP_HOSTS.has(new URL(socialNetwork.url).hostname.replace(/^www\./, ''));

const navLinkClassName =
  'flex h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-gray-700 hover:bg-white hover:text-store-navy';

export const SiteHeader = async () => {
  const [products, socialNetworks] = await Promise.all([loadProducts(), loadSocialNetworks()]);
  const whatsApp = socialNetworks.find(isWhatsApp);
  const storesPhrase = toStoresPhrase(products);

  return (
    <header>
      <p className="bg-store-yellow px-4 py-2 text-center text-sm font-semibold text-store-navy-950">
        Vitrine oficial MultiKoisas: escolha aqui e conclua a compra com segurança na loja parceira.
      </p>
      <div className="bg-store-navy px-4 py-3 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex flex-col">
            <BrandMark tone="onDark" />
            <span className="-mt-1.5 ml-13 text-xs font-semibold tracking-wider text-blue-100 uppercase">
              Tudo em um só lugar
            </span>
          </Link>
          {whatsApp && (
            <a
              href={whatsApp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-store-yellow px-3 text-sm font-bold text-store-navy-950 hover:brightness-95 lg:order-last"
            >
              <MessageCircle aria-hidden className="size-4" />
              Falar no WhatsApp
            </a>
          )}
          <div className="w-full lg:w-auto lg:max-w-xl lg:flex-1">
            <VitrineSearchField id="site-header-search" label="Buscar produto no cabeçalho" />
          </div>
        </div>
      </div>
      <div className="bg-gray-100 px-4 py-2 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 md:flex-row-reverse md:items-center md:justify-between">
          <nav aria-label="Seções do site" className="flex gap-1">
            <Link href="/" className={navLinkClassName}>
              Início
            </Link>
            <VitrineLink className={navLinkClassName} />
            <Link href="/#sobre" className={navLinkClassName}>
              A loja
            </Link>
          </nav>
          {storesPhrase && (
            <p className="px-3 text-sm font-medium text-gray-600 md:px-0">{`Compre ${storesPhrase}`}</p>
          )}
        </div>
      </div>
    </header>
  );
};

import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { fetchProducts, STORE_PRESENTATION, type Product } from '@/entities/product';
import { fetchSocialNetworks, type SocialNetwork } from '@/entities/social-network';
import { VitrineSearchField } from '@/features/vitrine-filter';

const loadProducts = (): Promise<Product[]> => fetchProducts().catch(() => []);
const loadSocialNetworks = (): Promise<SocialNetwork[]> => fetchSocialNetworks().catch(() => []);

const isWhatsApp = (socialNetwork: SocialNetwork): boolean =>
  /whatsapp|wa\.me/i.test(`${socialNetwork.name} ${socialNetwork.url}`);

const storeStripLabel = (products: readonly Product[]): string | null => {
  const stores = [...new Set(products.flatMap((product) => product.storeLinks.map((storeLink) => storeLink.store)))];
  if (stores.length === 0) return null;
  const storesWithArticle = stores.map((store) => STORE_PRESENTATION[store].purchaseLabel.replace(/^Comprar /, ''));
  return `Compre ${new Intl.ListFormat('pt-BR', { type: 'disjunction' }).format(storesWithArticle)}`;
};

const navLinkClassName =
  'flex h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-gray-700 hover:bg-white hover:text-store-navy';

export const SiteHeaderV2 = async () => {
  const [products, socialNetworks] = await Promise.all([loadProducts(), loadSocialNetworks()]);
  const whatsApp = socialNetworks.find(isWhatsApp);
  const storeStrip = storeStripLabel(products);

  return (
    <header>
      <p className="bg-store-yellow px-4 py-2 text-center text-sm font-semibold text-store-navy-950">
        Vitrine oficial MultiKoisas: escolha aqui e conclua a compra com segurança na loja parceira.
      </p>
      <div className="bg-store-navy px-4 py-3 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <Link href="/v2" className="flex min-h-11 items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 items-center justify-center rounded-lg bg-store-yellow text-xl font-extrabold text-store-navy-950"
            >
              M
            </span>
            <span className="flex flex-col">
              <span className="text-xl leading-tight font-extrabold text-white">
                Multi<span className="text-store-yellow">Koisas</span>
              </span>
              <span className="text-xs font-semibold tracking-wider text-blue-100 uppercase">Tudo em um só lugar</span>
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
            <VitrineSearchField id="site-header-search" />
          </div>
        </div>
      </div>
      <div className="bg-gray-100 px-4 py-2 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 md:flex-row-reverse md:items-center md:justify-between">
          <nav aria-label="Seções da vitrine" className="flex gap-1">
            <a href="#vitrine" className={navLinkClassName}>
              Vitrine de produtos
            </a>
            <a href="#sobre" className={navLinkClassName}>
              Sobre a MultiKoisas
            </a>
          </nav>
          {storeStrip && <p className="px-3 text-sm font-medium text-gray-600 md:px-0">{storeStrip}</p>}
        </div>
      </div>
    </header>
  );
};

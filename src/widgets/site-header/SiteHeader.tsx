'use client';

import Link from 'next/link';
import { toStoresPhrase, useCatalog } from '@/entities/product';
import { StoreLogo, useStoreSettings } from '@/entities/store-settings';
import { ShowcaseLink, ShowcaseSearchField } from '@/features/showcase-filter';

const navLinkClassName =
  'flex h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-gray-700 hover:bg-white hover:text-store-navy';

export const SiteHeader = () => {
  const catalog = useCatalog();
  const { logoUrl } = useStoreSettings().settings;
  const storesPhrase = catalog.status === 'ready' ? toStoresPhrase(catalog.data.products) : null;

  return (
    <header aria-busy={catalog.status === 'loading'}>
      <p className="bg-store-yellow px-4 py-2 text-center text-sm font-semibold text-store-navy-950">
        Vitrine oficial MultiKoisas: escolha aqui e conclua a compra com segurança na loja parceira.
      </p>
      <div className="bg-store-navy px-4 py-3 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex flex-col">
            <StoreLogo tone="onDark" />
            <span
              className={`text-xs font-semibold tracking-wider text-blue-100 uppercase ${logoUrl ? 'mt-1' : '-mt-1.5 ml-13'}`}
            >
              Tudo em um só lugar
            </span>
          </Link>
          <div className="w-full lg:w-auto lg:max-w-xl lg:flex-1">
            <ShowcaseSearchField id="site-header-search" label="Buscar produto no cabeçalho" />
          </div>
        </div>
      </div>
      <div className="bg-gray-100 px-4 py-2 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 md:flex-row-reverse md:items-center md:justify-between">
          <nav aria-label="Seções do site" className="flex gap-1">
            <Link href="/" className={navLinkClassName}>
              Início
            </Link>
            <ShowcaseLink className={navLinkClassName} />
          </nav>
          {catalog.status === 'loading' && <span data-testid="stores-phrase-placeholder" className="block h-5" />}
          {storesPhrase && <p className="px-3 text-sm font-medium text-gray-600 md:px-0">{`Compre ${storesPhrase}`}</p>}
        </div>
      </div>
    </header>
  );
};

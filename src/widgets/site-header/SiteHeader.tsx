'use client';

import Link from 'next/link';
import { StoreLogo, useStoreSettings } from '@/entities/store-settings';
import { ShowcaseLink, ShowcaseSearchField } from '@/features/showcase-filter';

const navLinkClassName =
  'flex h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-gray-700 hover:bg-white hover:text-store-navy';

export const SiteHeader = () => {
  const { logoUrl, name } = useStoreSettings().settings;

  return (
    <header>
      <p className="bg-store-yellow px-4 py-2 text-center text-sm font-semibold text-store-navy-950">
        Vitrine oficial MultiKoisas: escolha aqui e conclua a compra com segurança na loja parceira.
      </p>
      <div className="bg-store-navy px-4 py-3 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex min-h-11 min-w-0 items-center gap-3">
            <StoreLogo tone="onDark" imageHeightClassName="h-14" imageAlt="" />
            {logoUrl && (
              <span className="truncate text-xl font-bold text-store-yellow uppercase lg:text-2xl">
                {name ?? 'MultiKoisas'}
              </span>
            )}
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
        </div>
      </div>
    </header>
  );
};

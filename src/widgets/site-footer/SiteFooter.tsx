'use client';

import Link from 'next/link';
import { SocialNetworkLinks, useSocialNetworks } from '@/entities/social-network';
import { STORE_SETTINGS, type StoreSettingsValues } from '@/entities/store-settings';
import { ShowcaseLink } from '@/features/showcase-filter';
import { BrandMark } from '@/shared/ui/BrandMark';

const headingClassName = 'text-sm font-bold tracking-wider text-store-yellow uppercase';
const shortcutClassName = 'flex min-h-11 items-center text-blue-100 hover:text-store-yellow';

export const SiteFooter = ({ settings = STORE_SETTINGS }: { settings?: StoreSettingsValues }) => {
  const socialNetworksState = useSocialNetworks();
  const socialNetworks = socialNetworksState.status === 'ready' ? socialNetworksState.data : [];
  const address = settings.address?.trim();
  return (
    <footer aria-busy={socialNetworksState.status === 'loading'} className="bg-store-navy text-blue-100">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3 lg:px-8">
        <div>
          <Link href="/" className="inline-flex">
            <BrandMark tone="onDark" />
          </Link>
          <p className="mt-3 max-w-xs text-sm">Utilidades para casa, cozinha, limpeza e organização, num lugar só.</p>
          {address && <address className="mt-3 max-w-xs text-sm not-italic">{address}</address>}
        </div>

        <nav aria-labelledby="site-footer-shortcuts">
          <h2 id="site-footer-shortcuts" className={headingClassName}>
            Navegue
          </h2>
          <ul className="mt-2">
            <li>
              <Link href="/" className={shortcutClassName}>
                Início
              </Link>
            </li>
            <li>
              <ShowcaseLink className={shortcutClassName} />
            </li>
          </ul>
        </nav>

        {socialNetworks.length > 0 && (
          <nav aria-labelledby="site-footer-social">
            <h2 id="site-footer-social" className={headingClassName}>
              Siga a MultiKoisas
            </h2>
            <SocialNetworkLinks
              socialNetworks={socialNetworks}
              className="mt-3"
              linkClassName="bg-white/10 text-sm font-semibold text-white hover:bg-store-yellow hover:text-store-navy-950"
            />
          </nav>
        )}
      </div>

      <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-blue-100">
        {`© ${new Date().getFullYear()} MultiKoisas. A venda e a entrega são feitas pelas lojas parceiras.`}
      </p>
    </footer>
  );
};

'use client';

import { isWhatsApp, SocialNetworkLinks, useSocialNetworks, WhatsAppLink } from '@/entities/social-network';
import { useStoreSettings } from '@/entities/store-settings';
import { BrandMark } from '@/shared/ui/BrandMark';

const DEFAULT_DESCRIPTION =
  'A MultiKoisas é uma loja de utilidades para casa, cozinha, limpeza, ferragens e organização.';

const StorePicture = ({ logoUrl, photoUrl }: { logoUrl: string | null; photoUrl: string | null }) => {
  if (!photoUrl) {
    return (
      <div
        role="img"
        aria-label="MultiKoisas"
        className="flex aspect-[4/3] items-center justify-center rounded-xl bg-store-navy p-8"
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- the logo can come from any https host, next/image only loads the configured ones
          <img src={logoUrl} alt="" className="size-full object-contain" />
        ) : (
          <div className="scale-150 sm:scale-200">
            <BrandMark tone="onDark" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
      {/* eslint-disable-next-line @next/next/no-img-element -- the photo can come from any https host, next/image only loads the configured ones */}
      <img src={photoUrl} alt="Foto da loja MultiKoisas" className="size-full object-cover" />
    </div>
  );
};

export const AboutSection = () => {
  const { description, logoUrl, photoUrl } = useStoreSettings().settings;
  const socialNetworksState = useSocialNetworks();
  const socialNetworks = socialNetworksState.status === 'ready' ? socialNetworksState.data : [];
  const whatsApp = socialNetworks.find(isWhatsApp);
  const otherNetworks = socialNetworks.filter((socialNetwork) => socialNetwork !== whatsApp);

  return (
    <section
      id="about"
      aria-busy={socialNetworksState.status === 'loading'}
      className="mx-auto max-w-7xl scroll-mt-4 px-4 py-6 lg:px-8"
    >
      <div className="grid gap-6 rounded-xl bg-white p-5 shadow-theme-xs lg:grid-cols-2 lg:items-center lg:p-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-store-navy sm:text-3xl">
            MultiKoisas: utilidades para casa, cozinha, limpeza e organização
          </h1>
          <p className="mt-3 text-gray-700">{description ?? DEFAULT_DESCRIPTION}</p>
          <p className="mt-2 text-gray-600">
            Aqui na vitrine você encontra o produto certo e conclui a compra direto na loja parceira da sua preferência.
          </p>
          {whatsApp && <WhatsAppLink url={whatsApp.url} className="mt-4" />}
          {otherNetworks.length > 0 && (
            <SocialNetworkLinks
              socialNetworks={otherNetworks}
              className="mt-4"
              linkClassName="bg-gray-100 text-sm font-bold text-store-navy hover:bg-store-navy hover:text-white"
            />
          )}
        </div>
        <StorePicture logoUrl={logoUrl} photoUrl={photoUrl} />
      </div>
    </section>
  );
};

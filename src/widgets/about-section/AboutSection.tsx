import Image from 'next/image';
import {
  fetchSocialNetworks,
  isWhatsApp,
  SocialNetworkLinks,
  WhatsAppLink,
  type SocialNetwork,
} from '@/entities/social-network';
import { BrandMark } from '@/shared/ui/BrandMark';
import { STORE_PHOTO, type StorePhoto } from './storePhoto';

const loadSocialNetworks = (): Promise<SocialNetwork[]> => fetchSocialNetworks().catch(() => []);

const StorePicture = ({ storePhoto }: { storePhoto: StorePhoto | null }) => {
  if (!storePhoto) {
    return (
      <div
        role="img"
        aria-label="MultiKoisas"
        className="flex aspect-[4/3] items-center justify-center rounded-xl bg-store-navy"
      >
        <div className="scale-150 sm:scale-200">
          <BrandMark tone="onDark" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
      <Image
        src={storePhoto.src}
        alt={storePhoto.alt}
        fill
        preload
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover"
      />
    </div>
  );
};

export const AboutSection = async ({ storePhoto = STORE_PHOTO }: { storePhoto?: StorePhoto | null } = {}) => {
  const socialNetworks = await loadSocialNetworks();
  const whatsApp = socialNetworks.find(isWhatsApp);
  const otherNetworks = socialNetworks.filter((socialNetwork) => socialNetwork !== whatsApp);

  return (
    <section id="sobre" className="mx-auto max-w-7xl scroll-mt-4 px-4 py-6 lg:px-8">
      <div className="grid gap-6 rounded-xl bg-white p-5 shadow-theme-xs lg:grid-cols-2 lg:items-center lg:p-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-store-navy sm:text-3xl">
            MultiKoisas: utilidades para casa, cozinha, limpeza e organização
          </h1>
          <p className="mt-3 text-gray-700">
            A MultiKoisas é uma loja de utilidades para casa, cozinha, limpeza, ferragens e organização.
          </p>
          <p className="mt-2 text-gray-600">
            Aqui na vitrine você encontra o produto certo e conclui a compra direto na loja parceira da sua
            preferência.
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
        <StorePicture storePhoto={storePhoto} />
      </div>
    </section>
  );
};

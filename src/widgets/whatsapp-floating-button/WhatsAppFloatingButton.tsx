import { fetchSocialNetworks, isWhatsApp, SocialNetworkIcon, type SocialNetwork } from '@/entities/social-network';

const loadSocialNetworks = (): Promise<SocialNetwork[]> => fetchSocialNetworks().catch(() => []);

export const WhatsAppFloatingButton = async () => {
  const whatsApp = (await loadSocialNetworks()).find(isWhatsApp);
  if (!whatsApp) return null;
  return (
    <a
      href={whatsApp.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a MultiKoisas no WhatsApp"
      title="Falar no WhatsApp"
      className="flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:brightness-95 focus-visible:ring-4 focus-visible:ring-store-yellow focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:scale-100 [&_svg]:size-8"
    >
      <SocialNetworkIcon name="WhatsApp" />
    </a>
  );
};

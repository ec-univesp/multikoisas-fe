'use client';

import { isWhatsApp, SocialNetworkIcon, useSocialNetworks } from '@/entities/social-network';

export const WhatsAppFloatingButton = () => {
  const socialNetworks = useSocialNetworks();
  const whatsApp = socialNetworks.status === 'ready' ? socialNetworks.data.find(isWhatsApp) : undefined;
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

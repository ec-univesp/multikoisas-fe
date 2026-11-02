import { MessageCircle } from 'lucide-react';
import type { SocialNetwork } from './types';

const WHATSAPP_HOSTS = new Set(['wa.me', 'api.whatsapp.com', 'whatsapp.com']);

export const isWhatsApp = (socialNetwork: SocialNetwork): boolean =>
  WHATSAPP_HOSTS.has(new URL(socialNetwork.url).hostname.replace(/^www\./, ''));

export const WhatsAppLink = ({ url, className = '' }: { url: string; className?: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className={`flex h-11 w-fit shrink-0 items-center gap-2 rounded-lg bg-store-yellow px-3 text-sm font-bold text-store-navy-950 hover:brightness-95 ${className}`}
  >
    <MessageCircle aria-hidden className="size-4" />
    Falar no WhatsApp
  </a>
);

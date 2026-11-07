import { getFromApi } from '@/shared/api/getFromApi';
import type { SocialNetwork } from './types';

type SocialNetworkResponse = { id: number; descricao: string; link: string };

export const isHttpsUrl = (link: string): boolean => {
  try {
    return new URL(link).protocol === 'https:';
  } catch {
    return false;
  }
};

// The store owner registered links like "wa.me/..." without the scheme.
const withScheme = (link: string): string => {
  const trimmedLink = link.trim();
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmedLink) ? trimmedLink : `https://${trimmedLink}`;
};

export const fetchSocialNetworks = async (): Promise<SocialNetwork[]> =>
  (await getFromApi<SocialNetworkResponse>('/socialnetwork'))
    .map((socialNetwork) => ({
      id: socialNetwork.id,
      name: socialNetwork.descricao,
      url: withScheme(socialNetwork.link),
    }))
    .filter((socialNetwork) => isHttpsUrl(socialNetwork.url));

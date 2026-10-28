import { type FetchOptions, getFromApi } from '@/shared/api/getFromApi';
import type { SocialNetwork } from './types';

type SocialNetworkResponse = { id: number; descricao: string; link: string };

const isHttpsUrl = (link: string): boolean => {
  try {
    return new URL(link).protocol === 'https:';
  } catch {
    return false;
  }
};

export const fetchSocialNetworks = async (options: FetchOptions = {}): Promise<SocialNetwork[]> =>
  (await getFromApi<SocialNetworkResponse[]>('/socialnetwork', options))
    .filter((socialNetwork) => isHttpsUrl(socialNetwork.link))
    .map((socialNetwork) => ({
      id: socialNetwork.id,
      name: socialNetwork.descricao,
      url: socialNetwork.link,
    }));

import { type FetchOptions, getFromApi } from '@/shared/api/getFromApi';
import type { SocialNetwork } from './types';

type SocialNetworkResponse = { id: number; descricao: string; link: string };

export const fetchSocialNetworks = async (options: FetchOptions = {}): Promise<SocialNetwork[]> =>
  (await getFromApi<SocialNetworkResponse[]>('/socialnetwork', options)).map((socialNetwork) => ({
    id: socialNetwork.id,
    name: socialNetwork.descricao,
    url: socialNetwork.link,
  }));

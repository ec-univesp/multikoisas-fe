import type { SocialNetwork } from '@/entities/social-network';
import { getFromApi } from '@/shared/api/getFromApi';

type SocialNetworkResponse = { id: number; descricao: string; link: string };

export type SocialNetworkValues = { name: string; url: string };

const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;

export class SocialNetworkNameTakenError extends Error {}

const toSocialNetwork = (socialNetwork: SocialNetworkResponse): SocialNetwork => ({
  id: socialNetwork.id,
  name: socialNetwork.descricao,
  url: socialNetwork.link,
});

const pathOf = (socialNetwork: SocialNetwork): string =>
  `/api/socialnetwork/${encodeURIComponent(socialNetwork.name)}`;

const sendToApi = (method: string, path: string, { name, url }: SocialNetworkValues): Promise<Response> =>
  fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ descricao: name, link: url }),
  });

export const fetchAllSocialNetworks = async (): Promise<SocialNetwork[]> =>
  (await getFromApi<SocialNetworkResponse>('/socialnetwork', { fresh: true, fromBrowser: true })).map(
    toSocialNetwork,
  );

export const createSocialNetwork = async (values: SocialNetworkValues): Promise<void> => {
  const response = await sendToApi('POST', '/api/socialnetwork', values);
  if (response.status === HTTP_CONFLICT) throw new SocialNetworkNameTakenError('POST /socialnetwork respondeu 409');
  if (!response.ok) throw new Error(`POST /socialnetwork respondeu ${response.status}`);
};

export const updateSocialNetwork = async (
  socialNetwork: SocialNetwork,
  values: SocialNetworkValues,
): Promise<SocialNetwork> => {
  const response = await sendToApi('PUT', pathOf(socialNetwork), values);
  if (!response.ok) throw new Error(`PUT ${pathOf(socialNetwork)} respondeu ${response.status}`);
  return toSocialNetwork(await response.json());
};

export const deleteSocialNetwork = async (socialNetwork: SocialNetwork): Promise<void> => {
  const response = await fetch(pathOf(socialNetwork), { method: 'DELETE' });
  if (!response.ok && response.status !== HTTP_NOT_FOUND) {
    throw new Error(`DELETE ${pathOf(socialNetwork)} respondeu ${response.status}`);
  }
};

import type { SocialNetwork } from '@/entities/social-network';
import { getFromApi } from '@/shared/api/getFromApi';

type SocialNetworkResponse = { id: number; descricao: string; link: string };

export type SocialNetworkValues = { name: string; url: string };

const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;

export class SocialNetworkNameTakenError extends Error {}
export class SocialNetworkChangedElsewhereError extends Error {}

const toSocialNetwork = (socialNetwork: SocialNetworkResponse): SocialNetwork => ({
  id: socialNetwork.id,
  name: socialNetwork.descricao,
  url: socialNetwork.link,
});

const pathOf = (socialNetwork: SocialNetwork): string => `/api/socialnetwork/${socialNetwork.id}`;

const sendToApi = (method: string, path: string, body: { descricao?: string; link: string }): Promise<Response> =>
  fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const conflictErrorOf = async (response: Response, request: string): Promise<Error> => {
  const message = await response.text();
  if (message.includes('não encontrad')) return new SocialNetworkChangedElsewhereError(`${request} responded 409`);
  return new Error(`${request} responded 409`);
};

export const fetchAllSocialNetworks = async (): Promise<SocialNetwork[]> =>
  (await getFromApi<SocialNetworkResponse>('/socialnetwork')).map(toSocialNetwork);

export const createSocialNetwork = async (values: SocialNetworkValues): Promise<void> => {
  const response = await sendToApi('POST', '/api/socialnetwork', { descricao: values.name, link: values.url });
  if (response.status === HTTP_CONFLICT) throw new SocialNetworkNameTakenError('POST /socialnetwork responded 409');
  if (!response.ok) throw new Error(`POST /socialnetwork responded ${response.status}`);
};

export const updateSocialNetwork = async (
  socialNetwork: SocialNetwork,
  { url }: SocialNetworkValues,
): Promise<SocialNetwork> => {
  const request = `PUT ${pathOf(socialNetwork)}`;
  const response = await sendToApi('PUT', pathOf(socialNetwork), { link: url });
  if (response.status === HTTP_NOT_FOUND) throw new SocialNetworkChangedElsewhereError(`${request} responded 404`);
  if (response.status === HTTP_CONFLICT) throw await conflictErrorOf(response, request);
  if (!response.ok) throw new Error(`${request} responded ${response.status}`);
  return { ...socialNetwork, url };
};

export const deleteSocialNetwork = async (socialNetwork: SocialNetwork): Promise<void> => {
  const response = await fetch(pathOf(socialNetwork), { method: 'DELETE' });
  if (!response.ok && response.status !== HTTP_NOT_FOUND) {
    throw new Error(`DELETE ${pathOf(socialNetwork)} responded ${response.status}`);
  }
};

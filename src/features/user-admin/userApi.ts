import { getFromApi } from '@/shared/api/getFromApi';

export type UserAccount = { id: number; username: string; email: string; role: string };

export type UserValues = { username: string; email: string; password: string; role: string };

const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;

export class UsernameTakenError extends Error {}
export class EmailTakenError extends Error {}

export const isAdminRole = (role: string): boolean => role.toUpperCase() === 'ADMIN';

const pathOf = (username: string): string => `/api/user/${encodeURIComponent(username)}`;

const sendToApi = (method: string, path: string, body: Partial<UserValues>): Promise<Response> =>
  fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

// The API tells the two 409s apart only by the text of the answer.
const conflictErrorOf = async (response: Response, request: string): Promise<Error> => {
  const message = await response.text();
  if (message.includes('e-mail')) return new EmailTakenError(`${request} responded 409`);
  if (message.includes('nome de usuário')) return new UsernameTakenError(`${request} responded 409`);
  return new Error(`${request} responded 409`);
};

const throwUnlessOk = async (response: Response, request: string): Promise<void> => {
  if (response.status === HTTP_CONFLICT) throw await conflictErrorOf(response, request);
  if (!response.ok) throw new Error(`${request} responded ${response.status}`);
};

export const fetchAllUsers = (): Promise<UserAccount[]> => getFromApi<UserAccount>('/user');

export const createUser = async (values: UserValues): Promise<void> => {
  await throwUnlessOk(await sendToApi('POST', '/api/user', values), 'POST /user');
};

export const updateUser = async (user: UserAccount, { email, password, role }: UserValues): Promise<UserAccount> => {
  const body = password ? { email, role, password } : { email, role };
  const response = await sendToApi('PUT', pathOf(user.username), body);
  await throwUnlessOk(response, `PUT ${pathOf(user.username)}`);
  return response.json();
};

export const deleteUser = async (user: UserAccount): Promise<void> => {
  const response = await fetch(pathOf(user.username), { method: 'DELETE' });
  if (!response.ok && response.status !== HTTP_NOT_FOUND) {
    throw new Error(`DELETE ${pathOf(user.username)} responded ${response.status}`);
  }
};

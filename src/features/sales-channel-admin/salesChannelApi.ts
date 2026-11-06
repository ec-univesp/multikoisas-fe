import type { SalesChannel } from '@/entities/sales-channel';

type CanalVendaResponse = { id: number; nome: string };

const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;

export class SalesChannelNameTakenError extends Error {}

export class SalesChannelNotFoundError extends Error {}

export class SalesChannelInUseError extends Error {}

const callApi = async (method: string, path: string, body?: unknown): Promise<Response> => {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === HTTP_NOT_FOUND) throw new SalesChannelNotFoundError(`${method} ${path} respondeu 404`);
  if (response.status === HTTP_CONFLICT) {
    const ConflictError = method === 'DELETE' ? SalesChannelInUseError : SalesChannelNameTakenError;
    throw new ConflictError(`${method} ${path} respondeu 409`);
  }
  if (!response.ok) throw new Error(`${method} ${path} respondeu ${response.status}`);
  return response;
};

export const createSalesChannel = async (name: string): Promise<SalesChannel> => {
  const canalVenda: CanalVendaResponse = await (await callApi('POST', '/canalvenda', { nome: name })).json();
  return { id: canalVenda.id, name: canalVenda.nome };
};

export const deleteSalesChannel = async (salesChannel: SalesChannel): Promise<void> => {
  try {
    await callApi('DELETE', `/canalvenda/${salesChannel.id}`);
  } catch (error) {
    if (!(error instanceof SalesChannelNotFoundError)) throw error;
  }
};

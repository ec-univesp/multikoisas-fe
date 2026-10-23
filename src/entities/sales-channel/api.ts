import { type FetchOptions, getFromApi } from '@/shared/api/getFromApi';
import type { SalesChannel } from './types';

type CanalVendaResponse = { id: number; nome: string };

export const fetchSalesChannels = async (options: FetchOptions = {}): Promise<SalesChannel[]> =>
  (await getFromApi<CanalVendaResponse[]>('/canalvenda', options)).map((canalVenda) => ({
    id: canalVenda.id,
    name: canalVenda.nome,
  }));

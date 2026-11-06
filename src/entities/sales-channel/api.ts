import { type FetchOptions, getFromApi } from '@/shared/api/getFromApi';
import type { SalesChannel } from './types';

type ApiSalesChannel = { id: number; nome: string };

export const fetchSalesChannels = async (options: FetchOptions = {}): Promise<SalesChannel[]> =>
  (await getFromApi<ApiSalesChannel>('/canalvenda', options)).map((apiSalesChannel) => ({
    id: apiSalesChannel.id,
    name: apiSalesChannel.nome,
  }));

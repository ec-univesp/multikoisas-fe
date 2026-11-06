import { getFromApi } from '@/shared/api/getFromApi';
import type { SalesChannel } from './types';

type ApiSalesChannel = { id: number; nome: string };

export const fetchSalesChannels = async (): Promise<SalesChannel[]> =>
  (await getFromApi<ApiSalesChannel>('/canalvenda')).map((apiSalesChannel) => ({
    id: apiSalesChannel.id,
    name: apiSalesChannel.nome,
  }));

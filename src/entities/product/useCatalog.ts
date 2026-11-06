import { useLoadOnMount } from '@/shared/api/useLoadOnMount';
import { fetchCatalog } from './api';

const loadCatalog = () => fetchCatalog({ fresh: true, fromBrowser: true });

export const useCatalog = () => useLoadOnMount(loadCatalog);

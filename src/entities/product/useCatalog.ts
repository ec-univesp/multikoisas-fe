import { useLoadOnMount } from '@/shared/api/useLoadOnMount';
import { fetchCatalog } from './api';

const loadCatalog = () => fetchCatalog();

export const useCatalog = () => useLoadOnMount(loadCatalog);

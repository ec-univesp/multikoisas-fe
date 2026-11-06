import { useLoadOnMount } from '@/shared/api/useLoadOnMount';
import { fetchSocialNetworks } from './api';

const loadSocialNetworks = () => fetchSocialNetworks();

export const useSocialNetworks = () => useLoadOnMount(loadSocialNetworks);

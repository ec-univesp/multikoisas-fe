import { useLoadOnMount } from '@/shared/api/useLoadOnMount';
import { fetchSocialNetworks } from './api';

const loadSocialNetworks = () => fetchSocialNetworks({ fresh: true, fromBrowser: true });

export const useSocialNetworks = () => useLoadOnMount(loadSocialNetworks);

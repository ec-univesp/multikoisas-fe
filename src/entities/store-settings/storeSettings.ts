import { DEFAULT_STORE_SETTINGS } from '@/shared/local-api/database';
import type { StoreSettings } from './types';

// Shown while the saved settings load or when they cannot be read.
export const STORE_SETTINGS: StoreSettings = DEFAULT_STORE_SETTINGS;

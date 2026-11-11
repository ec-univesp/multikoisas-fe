import type { StoreSettings } from './types';

// Shown while the saved settings load or when they cannot be read.
export const STORE_SETTINGS: StoreSettings = { description: null, logoUrl: null, photoUrl: null };

// The API does not keep the address.
export const STORE_ADDRESS = 'Av. Prof. Luiz Inácio de Anhaia Melo, 2085 - Centreville, Santo André - SP';

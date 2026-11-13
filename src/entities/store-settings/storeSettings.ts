import type { StoreSettings } from './types';

// Shown while the saved settings load or when they cannot be read.
export const STORE_SETTINGS: StoreSettings = {
  name: null,
  description: null,
  address: null,
  logoUrl: null,
  photoUrl: null,
};

// Shown while the address saved in the API loads or when the store has none.
export const STORE_ADDRESS = 'Av. Prof. Luiz Inácio de Anhaia Melo, 2085 - Centreville, Santo André - SP';

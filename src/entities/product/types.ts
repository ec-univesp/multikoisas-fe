export type StoreSlug = 'mercado-livre' | 'shopee' | 'aliexpress';

type StorePresentation = {
  name: string;
  purchaseLabel: string;
  purchaseButtonClassName: string;
  /** Mesma cor de `purchaseButtonClassName`, para gráficos e outros usos fora do CSS.
   *  O Tailwind só gera a classe se o valor estiver escrito literalmente, por isso os dois campos. */
  brandColor: string;
  /** Cor de texto legível sobre `brandColor`. */
  brandTextColor: string;
};

export const STORE_PRESENTATION: Record<StoreSlug, StorePresentation> = {
  'mercado-livre': {
    name: 'Mercado Livre',
    purchaseLabel: 'Comprar no Mercado Livre',
    purchaseButtonClassName: 'bg-[#FFE600] text-[#2D3277] hover:bg-[#EFD700]',
    brandColor: '#FFE600',
    brandTextColor: '#2D3277',
  },
  shopee: {
    name: 'Shopee',
    purchaseLabel: 'Comprar na Shopee',
    purchaseButtonClassName: 'bg-[#D0401C] text-white hover:bg-[#B93817]',
    brandColor: '#D0401C',
    brandTextColor: '#FFFFFF',
  },
  aliexpress: {
    name: 'AliExpress',
    purchaseLabel: 'Comprar no AliExpress',
    purchaseButtonClassName: 'bg-[#C92704] text-white hover:bg-[#AC2103]',
    brandColor: '#C92704',
    brandTextColor: '#FFFFFF',
  },
};

export type StoreLink = {
  store: StoreSlug;
  url: string;
};

export type Product = {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  longDescription: string;
  images: string[];
  storeLinks: StoreLink[];
};

export type StoreSlug = 'mercado-livre' | 'shopee' | 'aliexpress' | 'magalu';

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
  magalu: {
    name: 'Magalu',
    purchaseLabel: 'Comprar na Magalu',
    purchaseButtonClassName: 'bg-[#0068D1] text-white hover:bg-[#0057AF]',
    brandColor: '#0068D1',
    brandTextColor: '#FFFFFF',
  },
};

export const PRODUCT_IMAGE_PLACEHOLDER = '/images/product/placeholder.svg';

export type StoreLink = {
  store: StoreSlug;
  url: string;
};

export type Category = {
  id: number;
  name: string;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  category: string;
  categoryId: number | null;
  shortDescription: string;
  longDescription: string;
  images: string[];
  storeLinks: StoreLink[];
};

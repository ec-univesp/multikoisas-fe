import type { ApiDatabase } from '@/shared/local-api/database';

export const SUPABASE_IMAGES = 'https://avphmmvnlrbidhjrzozx.supabase.co/storage/v1/object/public/imagem';

const seed = (): ApiDatabase => ({
  products: [
    { id: 1, nome: 'Garrafa Térmica 1L', descricaoProduto: '\r\nMantém a temperatura.\r\n\r\nAmpola de vidro.' },
    { id: 5, nome: 'Balde 12L', descricaoProduto: 'Resistente.' },
    { id: 7, nome: 'Caixa', descricaoProduto: 'Organiza a casa.' },
  ],
  categories: [
    { id: 2, nome: 'Utensílios de Cozinha' },
    { id: 3, nome: 'Banheiros' },
  ],
  productCategories: [
    { produtoId: 1, categoriaId: 2 },
    { produtoId: 7, categoriaId: 2 },
    { produtoId: 7, categoriaId: 3 },
  ],
  productImages: [
    { id: 12, produtoId: 1, imagemUrl: `${SUPABASE_IMAGES}/garrafa-lado.webp` },
    { id: 10, produtoId: 1, imagemUrl: `${SUPABASE_IMAGES}/garrafa-frente.webp` },
    { id: 20, produtoId: 7, imagemUrl: `${SUPABASE_IMAGES}/caixa.webp` },
    // How the real API returns image 29: missing /object/ (UNIV-17 on santi).
    {
      id: 21,
      produtoId: 7,
      imagemUrl: 'https://avphmmvnlrbidhjrzozx.storage.supabase.co/storage/v1/public/imagem/caixa-tampa.jpeg',
    },
    { id: 22, produtoId: 7, imagemUrl: 'https://example.com/caixa-lado.webp' },
    {
      id: 11,
      produtoId: 1,
      imagemUrl: 'https://avphmmvnlrbidhjrzozx.storage.supabase.co/storage/v1/object/public/imagem/garrafa-tampa.jpeg',
    },
  ],
  socialNetworks: [
    { id: 1, descricao: 'Instagram', link: 'https://www.instagram.com/multikoisas' },
    { id: 2, descricao: 'Shopee', link: 'https://shopee.com.br/multikoisas' },
  ],
  salesChannels: [
    { id: 2, nome: 'Shopee' },
    { id: 3, nome: 'Instagram' },
    { id: 4, nome: 'Facebook' },
    { id: 5, nome: 'TikTok' },
    { id: 8, nome: 'MagaLu' },
  ],
  purchaseLinks: [
    { produtoId: 1, canalVendaId: 2, link: 'https://shopee.com.br/garrafa-termica' },
    { produtoId: 1, canalVendaId: 3, link: 'https://www.instagram.com/p/garrafa' },
    { produtoId: 7, canalVendaId: 2, link: 'https://shopee.com.br/caixa' },
  ],
  nextId: 100,
});

export const apiDatabase: ApiDatabase = seed();

export const resetApiDatabase = () => {
  Object.assign(apiDatabase, seed());
};

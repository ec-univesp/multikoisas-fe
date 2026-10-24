export type ProdutoRow = { id: number; nome: string; descricaoProduto: string };
export type CategoriaRow = { id: number; nome: string };
export type CategoriaProdutoRow = { produtoId: number; categoriaId: number };
export type CanalVendaRow = { id: number; nome: string };
export type ImagemRow = { id: number; produtoId: number; imagemUrl: string };
export type RedeSocialRow = { id: number; descricao: string; link: string };

type ApiDatabase = {
  produtos: ProdutoRow[];
  categorias: CategoriaRow[];
  categoriaProduto: CategoriaProdutoRow[];
  imagens: ImagemRow[];
  redesSociais: RedeSocialRow[];
  canaisVenda: CanalVendaRow[];
  nextId: number;
};

const SUPABASE_IMAGES = 'https://avphmmvnlrbidhjrzozx.supabase.co/storage/v1/object/public/imagem';

const seed = (): ApiDatabase => ({
  produtos: [
    { id: 1, nome: 'Garrafa Térmica 1L', descricaoProduto: '\r\nMantém a temperatura.\r\n\r\nAmpola de vidro.' },
    { id: 5, nome: 'Balde 12L', descricaoProduto: 'Resistente.' },
    { id: 7, nome: 'Caixa', descricaoProduto: 'Organiza a casa.' },
  ],
  categorias: [
    { id: 2, nome: 'Utensílios de Cozinha' },
    { id: 3, nome: 'Banheiros' },
  ],
  categoriaProduto: [
    { produtoId: 1, categoriaId: 2 },
    { produtoId: 7, categoriaId: 2 },
    { produtoId: 7, categoriaId: 3 },
  ],
  imagens: [
    { id: 12, produtoId: 1, imagemUrl: `${SUPABASE_IMAGES}/garrafa-lado.webp` },
    { id: 10, produtoId: 1, imagemUrl: `${SUPABASE_IMAGES}/garrafa-frente.webp` },
    { id: 20, produtoId: 7, imagemUrl: `${SUPABASE_IMAGES}/caixa.webp` },
    // Como a API real devolve a imagem 29: sem o /object/ (UNIV-17 no santi).
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
  redesSociais: [
    { id: 1, descricao: 'Instagram', link: 'https://www.instagram.com/multikoisas' },
    { id: 2, descricao: 'Shopee', link: 'https://shopee.com.br/multikoisas' },
  ],
  canaisVenda: [
    { id: 2, nome: 'Shopee' },
    { id: 3, nome: 'Instagram' },
    { id: 4, nome: 'Facebook' },
    { id: 5, nome: 'TikTok' },
  ],
  nextId: 100,
});

export const apiDatabase: ApiDatabase = seed();

export const resetApiDatabase = () => {
  Object.assign(apiDatabase, seed());
};

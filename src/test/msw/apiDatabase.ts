export type ProdutoRow = { id: number; nome: string; descricaoProduto: string };
export type CategoriaRow = { id: number; nome: string };
export type CategoriaProdutoRow = { produtoId: number; categoriaId: number };
export type RedeSocialRow = { id: number; descricao: string; link: string };

type ApiDatabase = {
  produtos: ProdutoRow[];
  categorias: CategoriaRow[];
  categoriaProduto: CategoriaProdutoRow[];
  redesSociais: RedeSocialRow[];
  nextId: number;
};

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
  redesSociais: [
    { id: 1, descricao: 'Instagram', link: 'https://www.instagram.com/multikoisas' },
    { id: 2, descricao: 'Shopee', link: 'https://shopee.com.br/multikoisas' },
  ],
  nextId: 100,
});

export const apiDatabase: ApiDatabase = seed();

export const resetApiDatabase = () => {
  Object.assign(apiDatabase, seed());
};

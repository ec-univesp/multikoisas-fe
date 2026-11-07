import { describe, expect, it } from 'vitest';
import { createDatabase, type DatabaseSeed } from '../../database';

const seed: DatabaseSeed = {
  products: [{ id: 3, nome: 'Balde', descricaoProduto: '' }],
  categories: [{ id: 9, nome: 'Casa' }],
  productCategories: [{ produtoId: 3, categoriaId: 9 }],
  productImages: [{ id: 41, produtoId: 3, imagemUrl: 'https://example.com/balde.webp' }],
  socialNetworks: [{ id: 2, descricao: 'Instagram', link: 'https://instagram.com/multikoisas' }],
  salesChannels: [{ id: 12, nome: 'Shopee' }],
  purchaseLinks: [{ produtoId: 3, canalVendaId: 12, link: 'https://shopee.com.br/balde' }],
  users: [{ id: 8, username: 'admin', email: 'pi2alunos@gmail.com', role: 'ADMIN' }],
};

describe('createDatabase', () => {
  it('continues the ids after the highest id of every table', () => {
    expect(createDatabase(seed).nextId).toBe(42);
  });

  it('continues the ids after the highest user id', () => {
    expect(
      createDatabase({ ...seed, users: [{ id: 60, username: 'maria', email: 'm@x.com', role: 'USER' }] }).nextId,
    ).toBe(61);
  });

  it('starts with no users when the seed has none', () => {
    expect(createDatabase({ ...seed, users: undefined }).users).toEqual([]);
  });

  it('starts the ids at 1 when the seed is empty', () => {
    const emptySeed: DatabaseSeed = {
      products: [],
      categories: [],
      productCategories: [],
      productImages: [],
      socialNetworks: [],
      salesChannels: [],
      purchaseLinks: [],
    };
    expect(createDatabase(emptySeed).nextId).toBe(1);
  });

  it('keeps the seed untouched when the database changes', () => {
    const database = createDatabase(seed);
    database.products[0].nome = 'Outro nome';
    database.categories.push({ id: 50, nome: 'Nova' });
    expect(seed.products[0].nome).toBe('Balde');
    expect(seed.categories).toHaveLength(1);
  });
});

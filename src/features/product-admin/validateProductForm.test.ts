import { describe, expect, it } from 'vitest';
import { hasProductFormErrors, validateProductForm } from './validateProductForm';
import type { ProductFormValues } from './types';

const validValues: ProductFormValues = {
  name: 'Garrafa Térmica 1L',
  category: 'cozinha',
  shortDescription: 'Mantém a temperatura por 12 horas.',
  longDescription: 'Descrição completa da garrafa térmica.',
  imageUrl: '/products/garrafa-termica-1l.svg',
  storeLinks: [{ id: 'link-1', store: 'mercado-livre', url: 'https://www.mercadolivre.com.br/produto' }],
};

describe('validateProductForm', () => {
  it('accepts fully filled values', () => {
    const errors = validateProductForm(validValues);
    expect(hasProductFormErrors(errors)).toBe(false);
  });

  it('requires the product name', () => {
    const errors = validateProductForm({ ...validValues, name: '   ' });
    expect(errors.name).toBe('Informe o nome do produto.');
  });

  it('requires the category', () => {
    const errors = validateProductForm({ ...validValues, category: '' });
    expect(errors.category).toBe('Informe a categoria do produto.');
  });

  it('requires the short description', () => {
    const errors = validateProductForm({ ...validValues, shortDescription: '' });
    expect(errors.shortDescription).toBe(
      'Informe a descrição curta exibida no card da vitrine.',
    );
  });

  it('requires the long description', () => {
    const errors = validateProductForm({ ...validValues, longDescription: '' });
    expect(errors.longDescription).toBe(
      'Informe a descrição completa exibida na página do produto.',
    );
  });

  it('requires the photo address', () => {
    const errors = validateProductForm({ ...validValues, imageUrl: '' });
    expect(errors.imageUrl).toBe('Informe o endereço da foto do produto.');
  });

  it('requires at least one store link', () => {
    const errors = validateProductForm({ ...validValues, storeLinks: [] });
    expect(errors.storeLinks).toBe('Adicione ao menos uma loja para venda do produto.');
  });

  it('rejects a store link with an invalid url', () => {
    const errors = validateProductForm({
      ...validValues,
      storeLinks: [{ id: 'link-1', store: 'shopee', url: 'não é uma url' }],
    });
    expect(errors.storeLinkUrls?.[0]).toBe(
      'Informe um endereço (URL) válido, começando com http:// ou https://.',
    );
  });

  it('rejects a store link with a non-http protocol', () => {
    const errors = validateProductForm({
      ...validValues,
      storeLinks: [{ id: 'link-1', store: 'shopee', url: 'ftp://shopee.com.br/produto' }],
    });
    expect(errors.storeLinkUrls?.[0]).toBeDefined();
  });

  it('flags only the invalid store link among several', () => {
    const errors = validateProductForm({
      ...validValues,
      storeLinks: [
        { id: 'link-1', store: 'mercado-livre', url: 'https://mercadolivre.com.br/produto' },
        { id: 'link-2', store: 'shopee', url: 'inválida' },
      ],
    });
    expect(errors.storeLinkUrls?.[0]).toBeUndefined();
    expect(errors.storeLinkUrls?.[1]).toBeDefined();
  });
});

import { describe, expect, it } from 'vitest';
import { hasProductFormErrors, validateProductForm } from '../../validateProductForm';
import type { ProductFormValues } from '../../types';

const validValues: ProductFormValues = {
  name: 'Garrafa Térmica 1L',
  categoryIds: ['2'],
  description: 'Mantém a temperatura por 12 horas.',
  purchaseLinks: [{ key: 1, salesChannelId: '2', url: 'https://shopee.com.br/garrafa' }],
};

describe('validateProductForm', () => {
  it('accepts fully filled values', () => {
    expect(hasProductFormErrors(validateProductForm(validValues))).toBe(false);
  });

  it('rejects blank fields', () => {
    expect(validateProductForm({ name: '   ', categoryIds: [], description: ' ', purchaseLinks: [] })).toEqual({
      name: 'Informe o nome do produto.',
      categoryIds: 'Escolha pelo menos uma categoria do produto.',
      description: 'Informe a descrição do produto.',
    });
  });
});

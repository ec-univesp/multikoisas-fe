import { describe, expect, it } from 'vitest';
import { hasProductFormErrors, validateProductForm } from './validateProductForm';
import type { ProductFormValues } from './types';

const validValues: ProductFormValues = {
  name: 'Garrafa Térmica 1L',
  categoryId: '2',
  description: 'Mantém a temperatura por 12 horas.',
};

describe('validateProductForm', () => {
  it('accepts fully filled values', () => {
    expect(hasProductFormErrors(validateProductForm(validValues))).toBe(false);
  });

  it('rejects blank fields', () => {
    expect(validateProductForm({ name: '   ', categoryId: '', description: ' ' })).toEqual({
      name: 'Informe o nome do produto.',
      categoryId: 'Escolha a categoria do produto.',
      description: 'Informe a descrição do produto.',
    });
  });
});

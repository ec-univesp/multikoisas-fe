import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ProductAdminPanel } from './ProductAdminPanel';
import type { Product } from '@/entities/product';

const buildProduct = (overrides: Partial<Product>): Product => ({
  slug: 'garrafa-termica-1l',
  name: 'Garrafa Térmica 1L',
  category: 'cozinha',
  shortDescription: 'Mantém a temperatura por 12 horas.',
  longDescription: 'Descrição completa da garrafa térmica.',
  images: ['/products/garrafa-termica-1l.svg'],
  storeLinks: [{ store: 'mercado-livre', url: 'https://www.mercadolivre.com.br/produto' }],
  ...overrides,
});

const fillRequiredProductFields = async (
  user: ReturnType<typeof userEvent.setup>,
  overrides: { name: string; category: string; imageUrl: string; shortDescription: string; longDescription: string },
) => {
  await user.type(screen.getByLabelText('Nome do produto'), overrides.name);
  await user.type(screen.getByLabelText('Categoria'), overrides.category);
  await user.type(screen.getByLabelText('Endereço da foto'), overrides.imageUrl);
  await user.type(
    screen.getByLabelText(/Descrição curta/),
    overrides.shortDescription,
  );
  await user.type(
    screen.getByLabelText(/Descrição completa/),
    overrides.longDescription,
  );
};

describe('ProductAdminPanel', () => {
  it('creates a product and lists it in the table', async () => {
    const user = userEvent.setup();
    render(<ProductAdminPanel initialProducts={[buildProduct({})]} />);

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));
    await fillRequiredProductFields(user, {
      name: 'Balde Multiuso 12L',
      category: 'limpeza',
      imageUrl: '/products/balde-multiuso-12l.svg',
      shortDescription: 'Balde resistente para uso doméstico.',
      longDescription: 'Balde de 12 litros, resistente e fácil de limpar.',
    });
    await user.type(
      screen.getByLabelText('Endereço do produto na loja'),
      'https://www.mercadolivre.com.br/balde',
    );

    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(screen.getByText('Balde Multiuso 12L')).toBeInTheDocument();
  });

  it('edits a product and updates its name in the table', async () => {
    const user = userEvent.setup();
    const product = buildProduct({});
    const untouchedProduct = buildProduct({ slug: 'balde-12l', name: 'Balde 12L' });
    render(<ProductAdminPanel initialProducts={[product, untouchedProduct]} />);

    await user.click(screen.getByRole('button', { name: `Editar ${product.name}` }));
    const nameInput = screen.getByLabelText('Nome do produto');
    await user.clear(nameInput);
    await user.type(nameInput, 'Garrafa Térmica 1.5L');
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(screen.getByText('Garrafa Térmica 1.5L')).toBeInTheDocument();
    expect(screen.queryByText('Garrafa Térmica 1L')).not.toBeInTheDocument();
    expect(screen.getByText('Balde 12L')).toBeInTheDocument();
  });

  it('keeps the product when the deletion is cancelled', async () => {
    const user = userEvent.setup();
    const product = buildProduct({});
    render(<ProductAdminPanel initialProducts={[product]} />);

    await user.click(screen.getByRole('button', { name: `Apagar ${product.name}` }));
    expect(screen.getByText(product.name, { selector: 'span' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByText(product.name, { selector: 'a' })).toBeInTheDocument();
  });

  it('removes the product when the deletion is confirmed, showing the empty state', async () => {
    const user = userEvent.setup();
    const product = buildProduct({});
    render(<ProductAdminPanel initialProducts={[product]} />);

    await user.click(screen.getByRole('button', { name: `Apagar ${product.name}` }));
    await user.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(screen.queryByText(product.name, { selector: 'a' })).not.toBeInTheDocument();
    expect(screen.getByText('Nenhum produto cadastrado.')).toBeInTheDocument();
  });

  it('shows an error and does not save when no store link remains', async () => {
    const user = userEvent.setup();
    render(<ProductAdminPanel initialProducts={[buildProduct({})]} />);

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));
    await user.click(screen.getByRole('button', { name: /Remover loja/ }));
    await fillRequiredProductFields(user, {
      name: 'Escorredor de Louça',
      category: 'cozinha',
      imageUrl: '/products/escorredor.svg',
      shortDescription: 'Escorredor de louça em inox.',
      longDescription: 'Escorredor de louça em aço inox, compacto.',
    });

    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(
      screen.getByText('Adicione ao menos uma loja para venda do produto.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Escorredor de Louça')).not.toBeInTheDocument();
  });

  it('shows an error and does not save when the store url is invalid', async () => {
    const user = userEvent.setup();
    render(<ProductAdminPanel initialProducts={[buildProduct({})]} />);

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));
    await fillRequiredProductFields(user, {
      name: 'Vassoura Limpa Tudo',
      category: 'limpeza',
      imageUrl: '/products/vassoura.svg',
      shortDescription: 'Vassoura multiuso.',
      longDescription: 'Vassoura com cerdas macias para todo tipo de piso.',
    });
    await user.type(screen.getByLabelText('Endereço do produto na loja'), 'não é uma url');

    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    expect(
      screen.getByText(
        'Informe um endereço (URL) válido, começando com http:// ou https://.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Vassoura Limpa Tudo')).not.toBeInTheDocument();
  });

  it('uses the first store link as the primary one shown in the table', async () => {
    const user = userEvent.setup();
    render(<ProductAdminPanel initialProducts={[buildProduct({})]} />);

    await user.click(screen.getByRole('button', { name: 'Novo produto' }));
    await fillRequiredProductFields(user, {
      name: 'Organizador de Gavetas',
      category: 'casa',
      imageUrl: '/products/organizador.svg',
      shortDescription: 'Organizador modular para gavetas.',
      longDescription: 'Organizador de gavetas com divisórias ajustáveis.',
    });
    await user.type(
      screen.getByLabelText('Endereço do produto na loja'),
      'https://www.mercadolivre.com.br/organizador',
    );

    await user.click(screen.getByRole('button', { name: 'Adicionar loja' }));
    const storeSelects = screen.getAllByLabelText('Loja');
    await user.selectOptions(storeSelects[1], 'shopee');
    const urlInputs = screen.getAllByLabelText('Endereço do produto na loja');
    await user.type(urlInputs[1], 'https://shopee.com.br/organizador');

    await user.click(screen.getByRole('button', { name: 'Tornar principal' }));
    await user.click(screen.getByRole('button', { name: 'Salvar produto' }));

    const row = screen.getByText('Organizador de Gavetas').closest('tr');
    if (!row) throw new Error('Product row not found');
    const badgeTexts = within(row)
      .getAllByText(/Mercado Livre|Shopee/)
      .map((badge) => badge.textContent);
    expect(badgeTexts).toEqual(['Shopee', 'Mercado Livre']);
  });
});

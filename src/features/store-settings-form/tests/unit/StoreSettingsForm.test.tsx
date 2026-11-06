import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { StoreSettingsForm } from '../../StoreSettingsForm';

const LINK_MESSAGE = 'Use um link que comece com https://.';
const RATING_MESSAGE = 'A nota vai de 0 a 5, com até uma casa decimal.';
const COUNT_MESSAGE = 'Use um número inteiro a partir de 0.';

const fillAndLeave = async (label: string, value: string) => {
  const user = userEvent.setup();
  const field = screen.getByLabelText(label);
  await user.clear(field);
  await user.type(field, value);
  await user.tab();
  return field;
};

describe('StoreSettingsForm', () => {
  it('starts empty while the store has no settings', () => {
    render(
      <StoreSettingsForm
        settings={{ address: null, googleReviewsUrl: null, googleRating: null, googleReviewCount: null }}
      />,
    );
    expect(screen.getByLabelText('Endereço')).toHaveValue('');
    expect(screen.getByLabelText('Link das avaliações no Google')).toHaveValue('');
    expect(screen.getByLabelText('Nota no Google')).toHaveValue(null);
    expect(screen.getByLabelText('Quantidade de avaliações')).toHaveValue(null);
  });

  it('starts with the current store settings', () => {
    render(
      <StoreSettingsForm
        settings={{
          address: 'Rua Exemplo, 100',
          googleReviewsUrl: 'https://g.page/r/multikoisas/review',
          googleRating: 4.8,
          googleReviewCount: 123,
        }}
      />,
    );
    expect(screen.getByLabelText('Endereço')).toHaveValue('Rua Exemplo, 100');
    expect(screen.getByLabelText('Link das avaliações no Google')).toHaveValue('https://g.page/r/multikoisas/review');
    expect(screen.getByLabelText('Nota no Google')).toHaveValue(4.8);
    expect(screen.getByLabelText('Quantidade de avaliações')).toHaveValue(123);
  });

  it('uses a 16px font on every field', () => {
    render(<StoreSettingsForm />);
    for (const field of screen.getAllByRole('textbox')) expect(field).toHaveClass('text-base');
    for (const field of screen.getAllByRole('spinbutton')) expect(field).toHaveClass('text-base');
  });

  it('asks for an https reviews link when leaving the field', async () => {
    render(<StoreSettingsForm />);
    const field = await fillAndLeave('Link das avaliações no Google', 'http://g.page/r/multikoisas');
    expect(screen.getByRole('alert')).toHaveTextContent(LINK_MESSAGE);
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription(LINK_MESSAGE);

    await fillAndLeave('Link das avaliações no Google', 'https://g.page/r/multikoisas');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(field).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('accepts a rating from 0 to 5 with one decimal place', async () => {
    render(<StoreSettingsForm />);
    await fillAndLeave('Nota no Google', '6');
    expect(screen.getByRole('alert')).toHaveTextContent(RATING_MESSAGE);
    await fillAndLeave('Nota no Google', '4.85');
    expect(screen.getByRole('alert')).toHaveTextContent(RATING_MESSAGE);
    await fillAndLeave('Nota no Google', '-1');
    expect(screen.getByRole('alert')).toHaveTextContent(RATING_MESSAGE);
    await fillAndLeave('Nota no Google', '4.8');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('accepts a whole review count from 0 up', async () => {
    render(<StoreSettingsForm />);
    await fillAndLeave('Quantidade de avaliações', '2.5');
    expect(screen.getByRole('alert')).toHaveTextContent(COUNT_MESSAGE);
    await fillAndLeave('Quantidade de avaliações', '-3');
    expect(screen.getByRole('alert')).toHaveTextContent(COUNT_MESSAGE);
    await fillAndLeave('Quantidade de avaliações', '0');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('accepts empty optional fields', async () => {
    render(<StoreSettingsForm />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Link das avaliações no Google'));
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps saving disabled and explains why', () => {
    render(<StoreSettingsForm />);
    const save = screen.getByRole('button', { name: 'Salvar dados' });
    expect(save).toBeDisabled();
    expect(save).toHaveAccessibleDescription(
      'Salvar os dados da loja ainda não está disponível: a API não guarda as configurações da loja.',
    );
  });
});

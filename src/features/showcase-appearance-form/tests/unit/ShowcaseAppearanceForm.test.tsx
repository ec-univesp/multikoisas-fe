import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ShowcaseAppearanceForm } from '../../ShowcaseAppearanceForm';

const SAVED_APPEARANCE = { showcaseColumns: 3, accentColor: '#22c55e' } as const;

describe('ShowcaseAppearanceForm', () => {
  it('starts with the saved columns and accent color', () => {
    render(<ShowcaseAppearanceForm settings={SAVED_APPEARANCE} />);
    expect(screen.getByLabelText('Colunas na vitrine (computador)')).toHaveValue('3');
    expect(screen.getByLabelText('Cor de destaque')).toHaveValue('#22c55e');
  });

  it('offers two, three or four columns', () => {
    render(<ShowcaseAppearanceForm settings={SAVED_APPEARANCE} />);
    const options = screen.getAllByRole('option').filter((option) => option.getAttribute('value') !== '');
    expect(options.map((option) => option.getAttribute('value'))).toEqual(['2', '3', '4']);
  });

  it('goes back to the default accent color', async () => {
    const user = userEvent.setup();
    render(<ShowcaseAppearanceForm settings={SAVED_APPEARANCE} />);
    await user.click(screen.getByRole('button', { name: 'Voltar à cor padrão' }));
    expect(screen.getByLabelText('Cor de destaque')).toHaveValue('#facc15');
  });

  it('uses a 16px font and a 44px touch target on the fields', () => {
    render(<ShowcaseAppearanceForm settings={SAVED_APPEARANCE} />);
    expect(screen.getByLabelText('Colunas na vitrine (computador)')).toHaveClass('text-base', 'h-11');
    expect(screen.getByLabelText('Cor de destaque')).toHaveClass('text-base', 'h-11');
  });
});

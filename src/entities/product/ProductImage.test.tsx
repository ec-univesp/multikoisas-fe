import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductImage } from './ProductImage';

const PHOTO = 'https://avphmmvnlrbidhjrzozx.supabase.co/storage/v1/object/public/imagem/sumiu.webp';

describe('ProductImage', () => {
  it('shows the photo while it loads', () => {
    render(<ProductImage src={PHOTO} alt="Caixa" width={40} height={40} />);
    expect(screen.getByAltText('Caixa')).toHaveAttribute('src', expect.stringContaining('sumiu.webp'));
  });

  it('falls back to the placeholder when the photo fails to load', () => {
    render(<ProductImage src={PHOTO} alt="Caixa" width={40} height={40} />);
    fireEvent.error(screen.getByAltText('Caixa'));
    expect(screen.getByAltText('Caixa')).toHaveAttribute('src', expect.stringContaining('placeholder'));
  });
});

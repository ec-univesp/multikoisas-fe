import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { apiDatabase, SUPABASE_IMAGES } from '@/test/msw/apiDatabase';
import { waitForApiAnswers } from '@/test/waitForLoaded';
import { StoreLogo } from '../../StoreLogo';

const SAVED_LOGO = `${SUPABASE_IMAGES}/logo.png`;

describe('StoreLogo', () => {
  it('shows the default brand mark while the store has no valid logo', async () => {
    render(<StoreLogo tone="onDark" />);
    expect(screen.getByText('Koisas')).toBeInTheDocument();
    await waitForApiAnswers();
    expect(screen.getByText('Koisas')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'MultiKoisas' })).not.toBeInTheDocument();
  });

  it('shows the given fallback while the store has no logo', () => {
    render(<StoreLogo fallback={<span>multikoisas</span>} />);
    expect(screen.getByText('multikoisas')).toBeInTheDocument();
  });

  it('shows the saved logo', async () => {
    apiDatabase.storeImages.push({ id: 2, imagemUrl: SAVED_LOGO, tipo: 'LOGO' });
    render(<StoreLogo />);
    const logo = await screen.findByRole('img', { name: 'MultiKoisas' });
    expect(logo).toHaveAttribute('src', SAVED_LOGO);
    expect(logo).toHaveClass('h-11', 'object-contain', 'max-w-48');
  });

  it('keeps the saved logo narrow in the compact menu', async () => {
    apiDatabase.storeImages.push({ id: 2, imagemUrl: SAVED_LOGO, tipo: 'LOGO' });
    render(<StoreLogo compact />);
    expect(await screen.findByRole('img', { name: 'MultiKoisas' })).toHaveClass('max-w-11');
  });

  it('takes a bigger, decorative image when asked', async () => {
    apiDatabase.storeImages.push({ id: 2, imagemUrl: SAVED_LOGO, tipo: 'LOGO' });
    const { container } = render(<StoreLogo imageHeightClassName="h-14" imageAlt="" />);
    await waitForApiAnswers();
    const logo = container.querySelector('img');
    expect(logo).toHaveClass('h-14');
    expect(logo).not.toHaveClass('h-11');
    expect(logo).toHaveAttribute('alt', '');
  });
});

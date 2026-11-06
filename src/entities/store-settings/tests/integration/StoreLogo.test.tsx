import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { waitForApiAnswers } from '@/test/waitForLoaded';
import { StoreLogo } from '../../StoreLogo';

describe('StoreLogo', () => {
  it('shows the default brand mark while the store has no logo', async () => {
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
    apiDatabase.storeSettings.logoUrl = '/local-images/5';
    render(<StoreLogo />);
    const logo = await screen.findByRole('img', { name: 'MultiKoisas' });
    expect(logo).toHaveAttribute('src', '/local-images/5');
    expect(logo).toHaveClass('h-11', 'object-contain', 'max-w-48');
  });

  it('keeps the saved logo narrow in the compact menu', async () => {
    apiDatabase.storeSettings.logoUrl = '/local-images/5';
    render(<StoreLogo compact />);
    expect(await screen.findByRole('img', { name: 'MultiKoisas' })).toHaveClass('max-w-11');
  });
});

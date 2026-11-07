import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { StoreAccentColor } from '../../StoreAccentColor';

const renderShowcase = () => {
  render(
    <StoreAccentColor>
      <p>vitrine</p>
    </StoreAccentColor>,
  );
  return screen.getByText('vitrine').parentElement;
};

describe('StoreAccentColor', () => {
  it('keeps the theme yellow while the store uses the default accent color', async () => {
    const wrapper = renderShowcase();
    await waitFor(() => expect(wrapper).toBeInTheDocument());
    expect(wrapper?.style.getPropertyValue('--color-store-yellow')).toBe('');
  });

  it('paints the showcase with the accent color chosen in the panel', async () => {
    apiDatabase.storeSettings.accentColor = '#1e40af';
    const wrapper = renderShowcase();
    await waitFor(() => expect(wrapper?.style.getPropertyValue('--color-store-yellow')).toBe('#1e40af'));
  });
});

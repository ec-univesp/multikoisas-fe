import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { GoogleReviewsBadge } from '../../GoogleReviewsBadge';

describe('GoogleReviewsBadge with the saved store settings', () => {
  it('shows the default rating while loading and then the saved one', async () => {
    apiDatabase.storeSettings.googleRating = 3.9;
    apiDatabase.storeSettings.googleReviewCount = 12;
    render(<GoogleReviewsBadge />);

    expect(screen.getByRole('link')).toHaveAccessibleName(/^Nota 4,7 de 5 no Google/);
    expect(
      await screen.findByRole('link', { name: 'Nota 3,9 de 5 no Google, 12 avaliações. Abre em outra aba.' }),
    ).toBeInTheDocument();
  });
});

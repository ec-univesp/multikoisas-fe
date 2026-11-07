import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiDatabase } from '@/test/msw/apiDatabase';
import { server } from '@/test/msw/server';
import { GoogleReviewsBadge } from '../../GoogleReviewsBadge';

describe('GoogleReviewsBadge with the saved store settings', () => {
  it('shows nothing while loading and then the saved rating', async () => {
    apiDatabase.storeSettings.googleRating = 3.9;
    apiDatabase.storeSettings.googleReviewCount = 12;
    render(<GoogleReviewsBadge />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: 'Nota 3,9 de 5 no Google, 12 avaliações. Abre em outra aba.' }),
    ).toBeInTheDocument();
  });

  it('shows the default rating when the saved settings cannot be read', async () => {
    server.use(http.get('*/configuracao', () => new HttpResponse(null, { status: 500 })));
    render(<GoogleReviewsBadge />);
    expect(await screen.findByRole('link')).toHaveAccessibleName(/^Nota 4,7 de 5 no Google/);
  });
});

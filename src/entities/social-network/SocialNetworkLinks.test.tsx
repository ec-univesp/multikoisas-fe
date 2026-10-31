import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SocialNetworkLinks } from './SocialNetworkLinks';

const socialNetworks = [
  { id: 1, name: 'Instagram', url: 'https://www.instagram.com/multikoisas' },
  { id: 2, name: 'Shopee', url: 'https://shopee.com.br/multikoisas' },
];

describe('SocialNetworkLinks', () => {
  it('links each network in a new tab with the styling of the place that uses it', () => {
    render(<SocialNetworkLinks socialNetworks={socialNetworks} className="mt-4" linkClassName="bg-gray-100" />);
    expect(screen.getByRole('list')).toHaveClass('mt-4', 'flex');
    const instagram = screen.getByRole('link', { name: 'Instagram' });
    expect(instagram).toHaveAttribute('href', 'https://www.instagram.com/multikoisas');
    expect(instagram).toHaveAttribute('target', '_blank');
    expect(instagram).toHaveAttribute('rel', 'noopener noreferrer');
    expect(instagram).toHaveClass('bg-gray-100', 'min-h-11');
    expect(screen.getByRole('link', { name: 'Shopee' })).toHaveAttribute('href', 'https://shopee.com.br/multikoisas');
  });
});

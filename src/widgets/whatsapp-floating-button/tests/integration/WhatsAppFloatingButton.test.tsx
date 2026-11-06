import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/test/msw/server';
import { waitForApiAnswers } from '@/test/waitForLoaded';
import { WhatsAppFloatingButton } from '../../WhatsAppFloatingButton';

const withSocialNetworks = (socialNetworks: { id: number; descricao: string; link: string }[]) =>
  server.use(http.get('*/socialnetwork', () => HttpResponse.json(socialNetworks)));

describe('WhatsAppFloatingButton', () => {
  it('floats at the bottom of the page and opens the store WhatsApp in a new tab', async () => {
    withSocialNetworks([
      { id: 1, descricao: 'Instagram', link: 'https://www.instagram.com/multikoisas' },
      { id: 2, descricao: 'WhatsApp', link: 'wa.me/message/V4IAOMTCK5XHP1' },
    ]);
    render(<WhatsAppFloatingButton />);

    const button = await screen.findByRole('link', { name: 'Falar com a MultiKoisas no WhatsApp' });
    expect(button).toHaveAttribute('href', 'https://wa.me/message/V4IAOMTCK5XHP1');
    expect(button).toHaveAttribute('target', '_blank');
    expect(button).toHaveAttribute('rel', 'noopener noreferrer');
    expect(button).toHaveClass('size-14', 'rounded-full');
    expect(button.querySelector('svg')).toHaveAttribute('data-icon', 'whatsapp');
  });

  it('stays out of the page when the store has no WhatsApp', async () => {
    render(
      <div data-testid="page">
        <WhatsAppFloatingButton />
      </div>,
    );
    await waitForApiAnswers();
    expect(screen.getByTestId('page')).toBeEmptyDOMElement();
  });

  it('stays out of the page when the api fails', async () => {
    server.use(http.get('*/socialnetwork', () => new HttpResponse(null, { status: 500 })));
    render(
      <div data-testid="page">
        <WhatsAppFloatingButton />
      </div>,
    );
    await waitForApiAnswers();
    expect(screen.getByTestId('page')).toBeEmptyDOMElement();
  });
});

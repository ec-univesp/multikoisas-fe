import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { ShowcaseSearchProvider } from '@/features/showcase-filter';
import { LocalApiProvider } from '@/shared/local-api/LocalApiProvider';
import { GoogleReviewsBadge } from '@/widgets/google-reviews-badge';
import { SiteHeader } from '@/widgets/site-header';
import { WhatsAppFloatingButton } from '@/widgets/whatsapp-floating-button';
import SiteLayout from '../../layout';

type ElementWithChildren = ReactElement<{ children?: ReactNode }>;

const findElementByType = (node: ReactNode, type: unknown): ElementWithChildren | undefined => {
  if (!isValidElement<{ children?: ReactNode }>(node)) return undefined;
  if (node.type === type) return node;
  return Children.toArray(node.props.children)
    .map((child) => findElementByType(child, type))
    .find((element) => element !== undefined);
};

describe('SiteLayout', () => {
  it('shares the showcase search between the header and the page', () => {
    const page = <p>página</p>;
    const provider = findElementByType(SiteLayout({ children: page }), ShowcaseSearchProvider);
    expect(provider).toBeDefined();
    expect(findElementByType(provider, SiteHeader)).toBeDefined();
    const main = findElementByType(provider, 'main');
    expect(Children.toArray(main?.props.children)).toHaveLength(1);
    expect(findElementByType(main, 'p')?.props.children).toBe('página');
  });

  it('floats the google reviews badge above the WhatsApp button, centered on the right edge', () => {
    const floating = findElementByType(SiteLayout({ children: <p>página</p> }), 'aside') as
      ReactElement<{ children?: ReactNode; className?: string; 'aria-label'?: string }> | undefined;
    expect(floating?.props['aria-label']).toBe('Contatos da loja');
    expect(floating?.props.className?.split(' ')).toEqual(
      expect.arrayContaining(['fixed', 'top-1/2', 'right-4', '-translate-y-1/2']),
    );
    const [badge, whatsApp] = Children.toArray(floating?.props.children);
    expect(isValidElement(badge) && badge.type).toBe(GoogleReviewsBadge);
    expect(isValidElement(whatsApp) && whatsApp.type).toBe(WhatsAppFloatingButton);
  });

  it('waits for the local api around the whole site but forces the light theme before it starts', () => {
    const layout = SiteLayout({ children: <p>página</p> });
    const provider = findElementByType(layout, LocalApiProvider);
    expect(findElementByType(provider, ShowcaseSearchProvider)).toBeDefined();
    expect(findElementByType(provider, 'aside')).toBeDefined();
    expect(findElementByType(provider, 'script')).toBeUndefined();
    expect(findElementByType(layout, 'script')).toBeDefined();
  });
});

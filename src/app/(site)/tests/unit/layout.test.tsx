import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { StoreAccentColor } from '@/entities/store-settings';
import { ShowcaseSearchProvider } from '@/features/showcase-filter';
import { GoogleReviewsBadge } from '@/widgets/google-reviews-badge';
import { SiteFooter } from '@/widgets/site-footer';
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
  it('shares the showcase search between the header and the page', async () => {
    const page = <p>página</p>;
    const provider = findElementByType(await SiteLayout({ children: page }), ShowcaseSearchProvider);
    expect(provider).toBeDefined();
    expect(findElementByType(provider, SiteHeader)).toBeDefined();
    const main = findElementByType(provider, 'main');
    expect(Children.toArray(main?.props.children)).toHaveLength(1);
    expect(findElementByType(main, 'p')?.props.children).toBe('página');
  });

  it('floats the google reviews badge above the WhatsApp button, centered on the right edge', async () => {
    const floating = findElementByType(await SiteLayout({ children: <p>página</p> }), 'aside') as
      ReactElement<{ children?: ReactNode; className?: string; 'aria-label'?: string }> | undefined;
    expect(floating?.props['aria-label']).toBe('Contatos da loja');
    expect(floating?.props.className?.split(' ')).toEqual(
      expect.arrayContaining(['fixed', 'top-1/2', 'right-4', '-translate-y-1/2']),
    );
    const [badge, whatsApp] = Children.toArray(floating?.props.children);
    expect(isValidElement(badge) && badge.type).toBe(GoogleReviewsBadge);
    expect(isValidElement(whatsApp) && whatsApp.type).toBe(WhatsAppFloatingButton);
  });

  it('forces the light theme and renders the site right away, without waiting for a browser api', async () => {
    const layout = (await SiteLayout({ children: <p>página</p> })) as ElementWithChildren;
    const [script, ...site] = Children.toArray(layout.props.children);
    expect(isValidElement(script) && script.type).toBe('script');
    expect(site.map((element) => isValidElement(element) && element.type)).toEqual([StoreAccentColor]);
  });

  it('paints the whole showcase with the accent color saved in the panel', async () => {
    const accentColor = findElementByType(await SiteLayout({ children: <p>página</p> }), StoreAccentColor);
    expect(
      Children.toArray(accentColor?.props.children).map((element) => isValidElement(element) && element.type),
    ).toEqual([ShowcaseSearchProvider, SiteFooter, 'aside']);
  });
});

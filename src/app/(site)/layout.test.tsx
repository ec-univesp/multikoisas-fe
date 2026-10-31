import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { VitrineSearchProvider } from '@/features/vitrine-filter';
import { SiteHeader } from '@/widgets/site-header';
import SiteLayout from './layout';

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
    const provider = findElementByType(SiteLayout({ children: page }), VitrineSearchProvider);
    expect(provider).toBeDefined();
    expect(findElementByType(provider, SiteHeader)).toBeDefined();
    const main = findElementByType(provider, 'main');
    expect(Children.toArray(main?.props.children)).toHaveLength(1);
    expect(findElementByType(main, 'p')?.props.children).toBe('página');
  });
});

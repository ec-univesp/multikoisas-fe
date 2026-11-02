import { Children, isValidElement } from 'react';
import { describe, expect, it } from 'vitest';
import { AboutSection } from '@/widgets/about-section';
import { FeaturedProducts } from '@/widgets/featured-products';
import { HowToBuy } from '@/widgets/how-to-buy';
import HomePage from './page';

const sectionTypes = () =>
  Children.toArray(HomePage().props.children).map((section) => (isValidElement(section) ? section.type : null));

describe('HomePage', () => {
  it('opens with the store, then the product carousel, then how to buy', () => {
    expect(sectionTypes()).toEqual([AboutSection, FeaturedProducts, HowToBuy]);
  });
});

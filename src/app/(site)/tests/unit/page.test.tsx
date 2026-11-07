import { Children, isValidElement } from 'react';
import { describe, expect, it } from 'vitest';
import { AboutSection } from '@/widgets/about-section';
import { FeaturedProducts } from '@/widgets/featured-products';
import { GoogleReviews } from '@/widgets/google-reviews';
import { HowToBuy } from '@/widgets/how-to-buy';
import { StoreLocation } from '@/widgets/store-location';
import HomePage from '../../page';

const sectionTypes = async () =>
  Children.toArray((await HomePage()).props.children).map((section) => (isValidElement(section) ? section.type : null));

describe('HomePage', () => {
  it('opens with the store, then the product carousel, then how to buy and the google reviews, and ends with the store location', async () => {
    expect(await sectionTypes()).toEqual([AboutSection, FeaturedProducts, HowToBuy, GoogleReviews, StoreLocation]);
  });
});

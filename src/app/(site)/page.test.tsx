import { Children, isValidElement } from 'react';
import { describe, expect, it } from 'vitest';
import { AboutSection } from '@/widgets/about-section';
import { HowToBuy } from '@/widgets/how-to-buy';
import HomePage from './page';

const sectionTypes = () =>
  Children.toArray(HomePage().props.children).map((section) => (isValidElement(section) ? section.type : null));

describe('HomePage', () => {
  it('opens with the store and ends with how to buy', () => {
    const types = sectionTypes();
    expect(types[0]).toBe(AboutSection);
    expect(types.at(-1)).toBe(HowToBuy);
  });
});

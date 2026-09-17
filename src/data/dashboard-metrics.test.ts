import { describe, expect, it } from 'vitest';
import {
  calculateChangePercentage,
  calculateClickRate,
  getTopClickedProducts,
} from './dashboard-metrics';

describe('calculateChangePercentage', () => {
  it('reports an upward trend when the current value grew', () => {
    expect(calculateChangePercentage(120, 100)).toEqual({ trend: 'up', percentage: 20 });
  });

  it('reports a downward trend when the current value shrank', () => {
    expect(calculateChangePercentage(80, 100)).toEqual({ trend: 'down', percentage: 20 });
  });

  it('avoids dividing by zero when there is no previous value', () => {
    expect(calculateChangePercentage(50, 0)).toEqual({ trend: 'up', percentage: 0 });
  });
});

describe('calculateClickRate', () => {
  it('divides clicks by visitors as a percentage', () => {
    expect(calculateClickRate(50, 200)).toBe(25);
  });

  it('avoids dividing by zero when there are no visitors', () => {
    expect(calculateClickRate(50, 0)).toBe(0);
  });
});

describe('getTopClickedProducts', () => {
  it('sorts entries by clicks in descending order', () => {
    const entries = [
      { slug: 'a', clicks: 10 },
      { slug: 'b', clicks: 30 },
      { slug: 'c', clicks: 20 },
    ];

    expect(getTopClickedProducts(entries)).toEqual([
      { slug: 'b', clicks: 30 },
      { slug: 'c', clicks: 20 },
      { slug: 'a', clicks: 10 },
    ]);
  });

  it('limits the result to the requested amount', () => {
    const entries = [
      { slug: 'a', clicks: 10 },
      { slug: 'b', clicks: 30 },
      { slug: 'c', clicks: 20 },
    ];

    expect(getTopClickedProducts(entries, 2)).toEqual([
      { slug: 'b', clicks: 30 },
      { slug: 'c', clicks: 20 },
    ]);
  });

  it('defaults to the mocked catalog when no entries are given', () => {
    expect(getTopClickedProducts().length).toBeGreaterThan(0);
  });
});

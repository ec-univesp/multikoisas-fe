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
      { name: 'a', category: 'Casa', clicks: 10 },
      { name: 'b', category: 'Casa', clicks: 30 },
      { name: 'c', category: 'Casa', clicks: 20 },
    ];

    expect(getTopClickedProducts(entries)).toEqual([
      { name: 'b', category: 'Casa', clicks: 30 },
      { name: 'c', category: 'Casa', clicks: 20 },
      { name: 'a', category: 'Casa', clicks: 10 },
    ]);
  });

  it('limits the result to the requested amount', () => {
    const entries = [
      { name: 'a', category: 'Casa', clicks: 10 },
      { name: 'b', category: 'Casa', clicks: 30 },
      { name: 'c', category: 'Casa', clicks: 20 },
    ];

    expect(getTopClickedProducts(entries, 2)).toEqual([
      { name: 'b', category: 'Casa', clicks: 30 },
      { name: 'c', category: 'Casa', clicks: 20 },
    ]);
  });

  it('defaults to the mocked catalog when no entries are given', () => {
    expect(getTopClickedProducts().length).toBeGreaterThan(0);
  });
});

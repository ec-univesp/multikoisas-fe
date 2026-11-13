import { describe, expect, it } from 'vitest';
import { isReadableAccentColor } from '../../accentColor';

describe('isReadableAccentColor', () => {
  it.each(['#facc15', '#22C55E', '#ffffff'])('accepts %s, light enough under the navy text', (color) => {
    expect(isReadableAccentColor(color)).toBe(true);
  });

  it.each(['#1e3a8a', '#000000', '#fff', 'yellow', '', null, 7])('refuses %j', (color) => {
    expect(isReadableAccentColor(color)).toBe(false);
  });
});

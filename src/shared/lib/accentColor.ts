const HEX_COLOR = /^#[0-9a-f]{6}$/i;
// The accent is the background of navy text and the text color over the navy header (WCAG AA for text).
const STORE_NAVY = '#1e3a8a';
const MINIMUM_CONTRAST = 4.5;

const channelLuminance = (channel: number): number => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const luminanceOf = (hexColor: string): number => {
  const [red, green, blue] = [1, 3, 5].map((start) =>
    channelLuminance(Number.parseInt(hexColor.slice(start, start + 2), 16)),
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

export const isReadableAccentColor = (value: unknown): value is string =>
  typeof value === 'string' &&
  HEX_COLOR.test(value) &&
  (luminanceOf(value) + 0.05) / (luminanceOf(STORE_NAVY) + 0.05) >= MINIMUM_CONTRAST;

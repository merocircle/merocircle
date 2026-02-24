/**
 * Design tokens aligned with web app (globals.css + Tailwind).
 * Web: --radius 0.625rem, rounded-md ≈ 8px, rounded-xl = radius+4px ≈ 14px.
 */
export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
} as const;

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

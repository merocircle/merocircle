/**
 * Shared styles for email components
 * Warm, personal, inner-circle aesthetic
 */

// Typography
export const body = {
  margin: '0 0 20px',
  fontSize: '15px',
  lineHeight: '26px',
  color: '#44403c',
  letterSpacing: '-0.1px',
};

export const heading1 = {
  margin: '0 0 20px',
  fontSize: '28px',
  lineHeight: '36px',
  fontWeight: '600',
  color: '#1c1917',
  letterSpacing: '-0.5px',
};

export const heading2 = {
  margin: '0 0 14px',
  fontSize: '22px',
  lineHeight: '30px',
  fontWeight: '600',
  color: '#1c1917',
  letterSpacing: '-0.3px',
};

export const heading3 = {
  margin: '0 0 10px',
  fontSize: '17px',
  lineHeight: '26px',
  fontWeight: '600',
  color: '#1c1917',
  letterSpacing: '-0.15px',
};

export const caption = {
  margin: '0',
  fontSize: '13px',
  lineHeight: '20px',
  color: '#78716c',
};

export const label = {
  margin: '0',
  fontSize: '11px',
  lineHeight: '18px',
  fontWeight: '600',
  color: '#a8a29e',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
};

// Buttons
export const primaryButton = {
  display: 'inline-block',
  padding: '12px 28px',
  backgroundColor: '#c4382a',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '20px',
  textDecoration: 'none',
  borderRadius: '24px',
  letterSpacing: '-0.1px',
};

export const secondaryButton = {
  display: 'inline-block',
  padding: '12px 28px',
  backgroundColor: '#fef7f5',
  color: '#c4382a',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '20px',
  textDecoration: 'none',
  borderRadius: '24px',
  letterSpacing: '-0.1px',
  border: '1px solid #fecaca',
};

export const linkButton = {
  color: '#c4382a',
  fontSize: '14px',
  fontWeight: '500',
  textDecoration: 'none',
  letterSpacing: '-0.1px',
};

// Layout
export const section = {
  padding: '0 32px',
};

export const divider = {
  margin: '32px 32px',
  border: 'none',
  borderTop: '1px solid #f5f0eb',
};

export const spacer = {
  height: '20px',
};

// Cards & Containers
export const card = {
  padding: '20px',
  backgroundColor: '#fafaf9',
  borderRadius: '12px',
  border: '1px solid #f5f0eb',
};

export const infoCard = {
  padding: '16px 20px',
  backgroundColor: '#fef7f5',
  borderRadius: '10px',
  borderLeft: '3px solid #c4382a',
};

export const warningCard = {
  padding: '16px 20px',
  backgroundColor: '#fffbeb',
  borderRadius: '10px',
  borderLeft: '3px solid #f59e0b',
};

export const errorCard = {
  padding: '16px 20px',
  backgroundColor: '#fef2f2',
  borderRadius: '10px',
  borderLeft: '3px solid #ef4444',
};

export const successCard = {
  padding: '16px 20px',
  backgroundColor: '#f0fdf4',
  borderRadius: '10px',
  borderLeft: '3px solid #22c55e',
};

// Colors — warm, Nepal-inspired palette
export const colors = {
  // Warm stone scale
  gray50: '#fafaf9',
  gray100: '#f5f5f4',
  gray200: '#e7e5e4',
  gray300: '#d6d3d1',
  gray400: '#a8a29e',
  gray500: '#78716c',
  gray600: '#57534e',
  gray700: '#44403c',
  gray800: '#292524',
  gray900: '#1c1917',
  
  // Brand — Nepal crimson
  primary: '#c4382a',
  primaryDark: '#a12e23',
  secondary: '#e76f51',
  
  // Warm background
  warmBg: '#fdf8f6',
  warmBorder: '#f5f0eb',
  
  // Status
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

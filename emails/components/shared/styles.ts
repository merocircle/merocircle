/**
 * Shared styles for email components
 * Ensures consistency across all email templates
 */

// Typography
export const body = {
  margin: '0 0 24px',
  fontSize: '16px',
  lineHeight: '26px',
  color: '#374151',
  letterSpacing: '-0.2px',
};

export const heading1 = {
  margin: '0 0 24px',
  fontSize: '32px',
  lineHeight: '40px',
  fontWeight: '600',
  color: '#111827',
  letterSpacing: '-0.6px',
};

export const heading2 = {
  margin: '0 0 16px',
  fontSize: '24px',
  lineHeight: '32px',
  fontWeight: '600',
  color: '#111827',
  letterSpacing: '-0.4px',
};

export const heading3 = {
  margin: '0 0 12px',
  fontSize: '18px',
  lineHeight: '28px',
  fontWeight: '600',
  color: '#111827',
  letterSpacing: '-0.2px',
};

export const caption = {
  margin: '0',
  fontSize: '14px',
  lineHeight: '20px',
  color: '#6B7280',
};

export const label = {
  margin: '0',
  fontSize: '13px',
  lineHeight: '20px',
  fontWeight: '500',
  color: '#6B7280',
  letterSpacing: '0.3px',
  textTransform: 'uppercase' as const,
};

// Buttons
export const primaryButton = {
  display: 'inline-block',
  padding: '14px 32px',
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '500',
  lineHeight: '20px',
  textDecoration: 'none',
  borderRadius: '8px',
  letterSpacing: '-0.1px',
};

export const secondaryButton = {
  display: 'inline-block',
  padding: '14px 32px',
  backgroundColor: '#EFF6FF',
  color: '#4f46e5',
  fontSize: '15px',
  fontWeight: '500',
  lineHeight: '20px',
  textDecoration: 'none',
  borderRadius: '8px',
  letterSpacing: '-0.1px',
  border: '1px solid #C7D2FE',
};

export const linkButton = {
  color: '#4f46e5',
  fontSize: '15px',
  fontWeight: '500',
  textDecoration: 'none',
  letterSpacing: '-0.1px',
};

// Layout
export const section = {
  padding: '0 40px',
};

export const divider = {
  margin: '48px 40px',
  border: 'none',
  borderTop: '1px solid #E5E7EB',
};

export const spacer = {
  height: '24px',
};

// Cards & Containers
export const card = {
  padding: '24px',
  backgroundColor: '#F9FAFB',
  borderRadius: '12px',
  border: '1px solid #E5E7EB',
};

export const infoCard = {
  padding: '20px',
  backgroundColor: '#EFF6FF',
  borderRadius: '8px',
  borderLeft: '4px solid #3B82F6',
};

export const warningCard = {
  padding: '20px',
  backgroundColor: '#FEF3C7',
  borderRadius: '8px',
  borderLeft: '4px solid #F59E0B',
};

export const errorCard = {
  padding: '20px',
  backgroundColor: '#FEF2F2',
  borderRadius: '8px',
  borderLeft: '4px solid #EF4444',
};

export const successCard = {
  padding: '20px',
  backgroundColor: '#ECFDF5',
  borderRadius: '8px',
  borderLeft: '4px solid #10B981',
};

// Colors
export const colors = {
  // Gray scale
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Brand
  primary: '#4f46e5',
  primaryDark: '#3730a3',
  secondary: '#7c3aed',
  
  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

/**
 * Centralized layout constants for the dashboard
 * All spacing and sizing values in one place for easy maintenance
 */

export const LAYOUT = {
  // Sidebar widths
  ACTIVITY_BAR_WIDTH: 64,
  RIGHT_PANEL_WIDTH: 320,
  
  // Content constraints
  CONTENT_MAX_WIDTH: 640,
  
  // Spacing
  GAPS: {
    NONE: 0,
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
  },
  
  // Mobile specific
  MOBILE: {
    HEADER_HEIGHT: 64,
    BOTTOM_NAV_HEIGHT: 64,
  },
  
  // Breakpoints (matching Tailwind)
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },
} as const;

export type LayoutConstants = typeof LAYOUT;

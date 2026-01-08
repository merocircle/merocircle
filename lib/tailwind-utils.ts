import { cn } from './utils';

export { cn };

export const spacing = {
  container: 'container mx-auto px-3 sm:px-4',
  containerPadding: 'px-3 sm:px-4 py-4 sm:py-8',
  section: 'mb-6 sm:mb-8',
  card: 'p-4 sm:p-6',
  cardHeader: 'p-4 sm:p-6',
  cardContent: 'p-4 sm:p-6',
} as const;

export const typography = {
  h1: 'text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100',
  h2: 'text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100',
  h3: 'text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100',
  body: 'text-sm sm:text-base text-gray-600 dark:text-gray-400',
  bodyLarge: 'text-base sm:text-lg text-gray-600 dark:text-gray-400',
  label: 'text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300',
  small: 'text-xs sm:text-sm text-gray-600 dark:text-gray-400',
  truncate: 'truncate',
} as const;

export const layout = {
  flexRow: 'flex items-center',
  flexCol: 'flex flex-col',
  flexRowResponsive: 'flex flex-col sm:flex-row sm:items-center',
  flexBetween: 'flex items-center justify-between',
  flexBetweenResponsive: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
  flexCenter: 'flex items-center justify-center',
  flexStart: 'flex items-start',
  flexWrap: 'flex flex-wrap sm:flex-nowrap',
  grid: 'grid',
  gridCols1: 'grid grid-cols-1',
  gridCols2: 'grid grid-cols-1 sm:grid-cols-2',
  gridCols4: 'grid grid-cols-1 md:grid-cols-4',
  gap: 'gap-1 sm:gap-2',
  gapMedium: 'gap-3 sm:gap-4',
  gapLarge: 'gap-4 sm:gap-6',
} as const;

export const responsive = {
  icon: 'w-3 h-3 sm:w-4 sm:h-4',
  iconSmall: 'w-4 h-4 sm:w-5 sm:h-5',
  iconMedium: 'w-6 h-6 sm:w-8 sm:h-8',
  iconLarge: 'w-8 h-8 sm:w-10 sm:h-10',
  avatar: 'w-12 h-12 sm:w-16 sm:h-16',
  avatarSmall: 'w-8 h-8 sm:w-10 sm:h-10',
  avatarLarge: 'w-24 h-24 sm:w-32 sm:h-32',
  button: 'flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap',
  buttonIcon: 'w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0',
  tab: 'text-xs sm:text-sm whitespace-nowrap',
  tabList: 'flex flex-wrap sm:flex-nowrap w-full sm:w-auto gap-1 sm:gap-2 h-auto',
} as const;

export const colors = {
  text: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-500',
  },
  bg: {
    page: 'bg-gray-50 dark:bg-gray-950',
    card: 'bg-white dark:bg-gray-900',
  },
} as const;

export const effects = {
  gradient: {
    blue: 'bg-gradient-to-r from-blue-500 to-purple-600',
    red: 'bg-gradient-to-r from-red-500 to-pink-600',
    green: 'bg-gradient-to-r from-green-500 to-emerald-600',
  },
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  },
  rounded: {
    full: 'rounded-full',
    lg: 'rounded-lg',
    md: 'rounded-md',
  },
} as const;

export const animations = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  },
  fadeInDelayed: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: 0.1 },
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5 },
  },
} as const;

export const common = {
  pageContainer: cn(spacing.container, spacing.containerPadding),
  pageHeader: cn(layout.flexBetweenResponsive, spacing.section),
  card: cn('rounded-lg border bg-white dark:bg-gray-900', spacing.card),
  buttonGroup: cn(layout.flexRow, 'space-x-2 sm:space-x-3 flex-shrink-0'),
  iconButton: cn(responsive.button, 'flex-shrink-0'),
  avatarContainer: cn(
    responsive.avatar,
    effects.gradient.blue,
    effects.rounded.full,
    layout.flexCenter,
    'flex-shrink-0'
  ),
  headerTitle: cn(layout.flexRow, 'space-x-3 sm:space-x-4 min-w-0 flex-1'),
  headerContent: cn('min-w-0 flex-1'),
  tabsContainer: cn('space-y-4 sm:space-y-6'),
} as const;

export function createResponsiveClasses(
  mobile: string,
  tablet?: string,
  desktop?: string
): string {
  const classes = [mobile];
  if (tablet) classes.push(`sm:${tablet}`);
  if (desktop) classes.push(`md:${desktop} lg:${desktop}`);
  return classes.join(' ');
}

export function createSpacingClasses(
  padding?: { x?: string; y?: string },
  margin?: { x?: string; y?: string }
): string {
  const classes: string[] = [];
  if (padding) {
    if (padding.x) classes.push(`px-${padding.x}`);
    if (padding.y) classes.push(`py-${padding.y}`);
  }
  if (margin) {
    if (margin.x) classes.push(`mx-${margin.x}`);
    if (margin.y) classes.push(`my-${margin.y}`);
  }
  return classes.join(' ');
}

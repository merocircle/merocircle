# Tailwind CSS Utilities Guide

This document explains how to use the centralized Tailwind CSS utilities to keep code clean and maintainable.

## Overview

Instead of writing long, repetitive class names throughout components, we use centralized utility objects from `@/lib/tailwind-utils`. This makes the code:
- **More readable**: Short, semantic names instead of long class strings
- **More maintainable**: Change styles in one place
- **More consistent**: Same patterns used across the app
- **Type-safe**: TypeScript autocomplete for all utilities

## Usage

### Basic Import

```tsx
import { cn } from '@/lib/utils';
import { 
  common, 
  spacing, 
  typography, 
  layout, 
  responsive, 
  colors, 
  effects, 
  animations 
} from '@/lib/tailwind-utils';
```

### Before & After Examples

#### Example 1: Page Container

**Before:**
```tsx
<div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
```

**After:**
```tsx
<div className={common.pageContainer}>
```

#### Example 2: Typography

**Before:**
```tsx
<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">
  Dashboard
</h1>
<p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 truncate">
  Welcome back, {name}
</p>
```

**After:**
```tsx
<h1 className={cn(typography.h1, typography.truncate)}>
  Dashboard
</h1>
<p className={cn(typography.body, typography.truncate)}>
  Welcome back, {name}
</p>
```

#### Example 3: Responsive Icons

**Before:**
```tsx
<Settings className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
```

**After:**
```tsx
<Settings className={responsive.buttonIcon} />
```

#### Example 4: Animations

**Before:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
```

**After:**
```tsx
<motion.div {...animations.fadeIn}>
```

#### Example 5: Layout

**Before:**
```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
```

**After:**
```tsx
<div className={common.pageHeader}>
```

## Available Utilities

### `spacing`
- `container` - Container with responsive padding
- `containerPadding` - Full container padding
- `section` - Section margin
- `card` - Card padding
- `cardHeader` - Card header padding
- `cardContent` - Card content padding

### `typography`
- `h1`, `h2`, `h3` - Heading styles
- `body`, `bodyLarge` - Body text
- `label`, `small` - Labels and small text
- `truncate` - Text truncation

### `layout`
- `flexRow`, `flexCol` - Basic flex layouts
- `flexRowResponsive` - Responsive flex row
- `flexBetween`, `flexCenter` - Flex with alignment
- `flexBetweenResponsive` - Responsive flex between
- `gridCols1`, `gridCols2`, `gridCols4` - Grid layouts
- `gap`, `gapMedium`, `gapLarge` - Gap utilities

### `responsive`
- `icon`, `iconSmall`, `iconMedium`, `iconLarge` - Icon sizes
- `avatar`, `avatarSmall`, `avatarLarge` - Avatar sizes
- `button`, `buttonIcon` - Button styles
- `tab`, `tabList` - Tab styles

### `colors`
- `text.primary`, `text.secondary`, `text.muted` - Text colors
- `bg.page`, `bg.card` - Background colors

### `effects`
- `gradient.blue`, `gradient.red`, `gradient.green` - Gradients
- `shadow.sm`, `shadow.md`, `shadow.lg` - Shadows
- `rounded.full`, `rounded.lg`, `rounded.md` - Border radius

### `animations`
- `fadeIn` - Standard fade in animation
- `fadeInDelayed` - Fade in with delay
- `slideIn` - Slide in from left

### `common`
Pre-composed common patterns:
- `pageContainer` - Full page container
- `pageHeader` - Page header layout
- `card` - Standard card
- `buttonGroup` - Button group layout
- `iconButton` - Icon button style
- `avatarContainer` - Avatar container
- `headerTitle` - Header title section
- `headerContent` - Header content section
- `tabsContainer` - Tabs container

## Combining Utilities

Use `cn()` to combine multiple utilities:

```tsx
<div className={cn(
  common.card,
  layout.flexRow,
  spacing.section
)}>
```

## Adding New Utilities

When you find yourself repeating the same class combinations:

1. Add to the appropriate category in `lib/tailwind-utils.ts`
2. Use `as const` for type safety
3. Document in this file
4. Update components to use the new utility

## Best Practices

1. **Use utilities for repeated patterns** - If you use a class combination 3+ times, add it to utilities
2. **Keep utilities semantic** - Name them by purpose, not by classes
3. **Combine with `cn()`** - Use `cn()` when combining multiple utilities
4. **Don't over-abstract** - Simple, one-off classes are fine inline
5. **Maintain consistency** - Use the same utilities across similar components

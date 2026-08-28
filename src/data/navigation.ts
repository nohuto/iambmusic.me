import type { NavigationItem } from './types.ts';

export const primaryNavigation: readonly NavigationItem[] = [
  { page: 'home', labelKey: 'home' },
  { page: 'music', labelKey: 'music' },
  { page: 'social', labelKey: 'social' },
  { page: 'about', labelKey: 'about' },
];

export const secondaryNavigation: readonly NavigationItem[] = [
  { page: 'contact', labelKey: 'contact' },
];

export const navigationItems: readonly NavigationItem[] = [
  ...primaryNavigation,
  ...secondaryNavigation,
];

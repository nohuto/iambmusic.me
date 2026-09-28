import type { IconName } from '../components/ui/Icon.astro';
import type { MediaSource } from './media.ts';

export const sourceNames = {
  youtube: 'YouTube',
  soundcloud: 'SoundCloud',
  tiktok: 'TikTok',
  instagram: 'Instagram',
} as const satisfies Record<MediaSource, string>;

export const sourceIcons = {
  youtube: 'youtube-logo',
  soundcloud: 'soundcloud-logo',
  tiktok: 'tiktok-logo',
  instagram: 'instagram-logo',
} as const satisfies Record<MediaSource, IconName>;

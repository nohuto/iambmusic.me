import type { ProfileId } from '../data/types.ts';

export type MediaSource = 'youtube' | 'soundcloud' | 'instagram' | 'tiktok';

export interface MediaThumbnail {
  readonly url: string;
  readonly width: number | null;
  readonly height: number | null;
}

export interface MediaItem {
  readonly id: string;
  readonly source: MediaSource;
  readonly url: string;
  readonly title: string;
  readonly publishedAt: string;
  readonly discoveredAt: string;
  readonly durationSeconds: number | null;
  readonly thumbnail: MediaThumbnail | null;
  readonly videoId?: string;
  readonly playback: 'youtube-embed' | 'soundcloud-widget' | 'external';
}

export interface MediaLibrary {
  readonly profile: ProfileId;
  readonly generatedAt: string;
  readonly refreshedAt: Partial<Record<MediaSource, string>>;
  readonly items: readonly MediaItem[];
}

const libraries = import.meta.glob<MediaLibrary>('../data/generated/media/*.json', {
  eager: true,
  import: 'default',
});

const empty: MediaLibrary = {
  profile: 'iamb',
  generatedAt: '',
  refreshedAt: {},
  items: [],
};

export function getProfileMedia(profile: ProfileId): MediaLibrary {
  const library = libraries[`../data/generated/media/${profile}.json`];
  if (!library || library.profile !== profile) return { ...empty, profile };
  return library;
}

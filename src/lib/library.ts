import type { Profile, ProfileId } from '../data/types.ts';
import { displayTitle, tidyTitle } from './display-title.ts';
import { getProfileMedia, type MediaItem, type MediaSource } from './media.ts';

export type SocialSource = 'tiktok' | 'instagram';
export type MusicSource = 'youtube' | 'soundcloud';
export type LibrarySource = MediaSource | 'local';

export interface LibraryRow {
  readonly id: string;
  readonly source: LibrarySource;
  readonly title: string;
  readonly publishedAt: string | null;
  readonly durationSeconds: number | null;
  readonly thumbnail: string | null;
  readonly url: string | null;
  readonly videoId: string | null;
  readonly playable: boolean;
}

function embeddable(item: MediaItem): boolean {
  return (
    item.playback === 'youtube-embed' || item.playback === 'soundcloud-widget'
  );
}

function fromMedia(profileId: ProfileId, item: MediaItem): LibraryRow {
  return {
    id: item.id,
    source: item.source,
    title:
      item.source === 'youtube' || item.source === 'soundcloud'
        ? displayTitle(profileId, item.title)
        : tidyTitle(item.title),
    publishedAt: item.publishedAt,
    durationSeconds: item.durationSeconds,
    thumbnail: item.thumbnail?.url ?? null,
    url: item.url,
    videoId: item.videoId ?? null,
    playable: embeddable(item),
  };
}

export function getMusicRows(profile: Profile): readonly LibraryRow[] {
  const local: LibraryRow[] = profile.tracks.map((track) => ({
    id: `local:${track.id}`,
    source: 'local',
    title: track.title,
    publishedAt: null,
    durationSeconds: track.durationSeconds,
    thumbnail: null,
    url: null,
    videoId: null,
    playable: true,
  }));

  const streams = getProfileMedia(profile.id)
    .items.filter(embeddable)
    .map((item) => fromMedia(profile.id, item));

  return [...local, ...streams];
}

export function getMusicSources(profile: Profile): readonly MusicSource[] {
  const rows = getProfileMedia(profile.id).items;
  return (['youtube', 'soundcloud'] as const).filter(
    (source) =>
      profile.platforms.some((platform) => platform.id === source) ||
      rows.some((row) => row.source === source),
  );
}

export function getSocialRows(profileId: ProfileId): readonly LibraryRow[] {
  return getProfileMedia(profileId)
    .items.filter(
      (item) => item.source === 'tiktok' || item.source === 'instagram',
    )
    .map((item) => fromMedia(profileId, item));
}

export function getSocialSources(
  profileId: ProfileId,
): readonly SocialSource[] {
  const rows = getSocialRows(profileId);
  return (['tiktok', 'instagram'] as const).filter((source) =>
    rows.some((row) => row.source === source),
  );
}

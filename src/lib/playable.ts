import type { Profile, ProfileId } from '../data/types.ts';
import { displayTitle } from './display-title.ts';
import { getProfileMedia } from './media.ts';

export interface PlayableTrack {
  readonly kind: 'local';
  readonly id: string;
  readonly title: string;
  readonly durationSeconds: number;
  readonly sources: readonly { src: string; mimeType: string }[];
}

export interface PlayableVideo {
  readonly kind: 'youtube';
  readonly id: string;
  readonly title: string;
  readonly videoId: string;
  readonly url: string;
  readonly thumbnail: string | null;
  readonly durationSeconds: number | null;
}

export interface PlayableSoundCloud {
  readonly kind: 'soundcloud';
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly thumbnail: string | null;
  readonly durationSeconds: number | null;
}

export type Playable = PlayableTrack | PlayableVideo | PlayableSoundCloud;

export function getPlayables(profile: Profile, profileId: ProfileId): Playable[] {
  const local: PlayableTrack[] = profile.tracks.map((track) => ({
    kind: 'local',
    id: `local:${track.id}`,
    title: track.title,
    durationSeconds: track.durationSeconds,
    sources: track.sources.map((source) => ({ src: source.src, mimeType: source.mimeType })),
  }));

  const videos: PlayableVideo[] = getProfileMedia(profileId)
    .items.filter((item) => item.source === 'youtube' && item.playback === 'youtube-embed')
    .map((item) => ({
      kind: 'youtube',
      id: item.id,
      title: displayTitle(profileId, item.title),
      videoId: item.videoId!,
      url: item.url,
      thumbnail: item.thumbnail?.url ?? null,
      durationSeconds: item.durationSeconds,
    }));

  const soundcloud: PlayableSoundCloud[] = getProfileMedia(profileId)
    .items.filter((item) => item.source === 'soundcloud' && item.playback === 'soundcloud-widget')
    .map((item) => ({
      kind: 'soundcloud',
      id: item.id,
      title: displayTitle(profileId, item.title),
      url: item.url,
      thumbnail: item.thumbnail?.url ?? null,
      durationSeconds: item.durationSeconds,
    }));

  return [...local, ...videos, ...soundcloud];
}

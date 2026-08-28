import type { Profile, ProfileId } from '../data/types.ts';
import { displayTitle } from './display-title.ts';
import { getProfileMedia } from './media.ts';

export interface PlayableTrack {
  readonly kind: 'local';
  readonly id: string;
  readonly title: string;
  readonly sources: readonly { src: string; mimeType: string }[];
}

export interface PlayableVideo {
  readonly kind: 'youtube';
  readonly id: string;
  readonly title: string;
  readonly videoId: string;
  readonly thumbnail: string | null;
  readonly durationSeconds: number | null;
}

export type Playable = PlayableTrack | PlayableVideo;

export function getPlayables(profile: Profile, profileId: ProfileId): Playable[] {
  const local: PlayableTrack[] = profile.tracks.map((track) => ({
    kind: 'local',
    id: `local:${track.id}`,
    title: track.title,
    sources: track.sources.map((source) => ({ src: source.src, mimeType: source.mimeType })),
  }));

  const videos: PlayableVideo[] = getProfileMedia(profileId)
    .items.filter((item) => item.source === 'youtube' && item.playback === 'youtube-embed')
    .map((item) => ({
      kind: 'youtube',
      id: item.id,
      title: displayTitle(profileId, item.title),
      videoId: item.videoId!,
      thumbnail: item.thumbnail?.url ?? null,
      durationSeconds: item.durationSeconds,
    }));

  return [...local, ...videos];
}

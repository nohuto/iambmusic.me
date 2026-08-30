export const languages = ['de', 'en'] as const;
export type Language = (typeof languages)[number];

export const profileIds = ['iamb', 'aimp'] as const;
export type ProfileId = (typeof profileIds)[number];

export const pageIds = ['home', 'music', 'social', 'about', 'contact'] as const;
export type PageId = (typeof pageIds)[number];

export type LocalizedText = Readonly<Record<Language, string>>;

export type AudioFormat = 'mp3' | 'm4a' | 'wav';

export interface AudioSource {
  readonly format: AudioFormat;
  readonly src: string;
  readonly mimeType: string;
}

export interface Track<P extends ProfileId = ProfileId> {
  readonly profile: P;
  readonly id: string;
  readonly title: string;
  readonly durationSeconds: number;
  readonly sources: readonly AudioSource[];
}

export const platformIds = [
  'youtube',
  'tiktok',
  'instagram',
  'spotify',
  'applemusic',
  'amazonmusic',
  'soundcloud',
  'beatport',
  'traxsource',
  'qobuz',
  'bandlab',
  'bandcamp',
] as const;
export type PlatformId = (typeof platformIds)[number];

export type PlatformCategory = 'listening' | 'social';

export interface PlatformLink<P extends ProfileId = ProfileId> {
  readonly profile: P;
  readonly id: PlatformId;
  readonly name: string;
  readonly url: string;
  readonly category: PlatformCategory;
  readonly brandMark?: string;
}

export interface ChannelIdentity<P extends ProfileId = ProfileId> {
  readonly profile: P;
  readonly handle: string;
  readonly channelId?: string;
}

export interface HeroContent {
  readonly title: LocalizedText;
  readonly lead: LocalizedText;
}

export type PageMeta = Readonly<Record<PageId, LocalizedText>>;

export interface ProfileImages {
  readonly logo: ImageMetadata;
  readonly logoAlt: LocalizedText;
}

export interface GlanceFact {
  readonly label: LocalizedText;
  readonly value: LocalizedText;
}

export interface TimelineEntry {
  readonly period: LocalizedText;
  readonly text: LocalizedText;
}

export interface StudioSetup {
  readonly software: LocalizedText;
  readonly hardware: LocalizedText;
}

export interface Inspiration {
  readonly name: string;
  readonly url: string;
  readonly image: ImageMetadata;
}

export interface Profile<P extends ProfileId = ProfileId> {
  readonly id: P;
  readonly name: string;
  readonly shortName: string;
  readonly meta: PageMeta;
  readonly hero: HeroContent;
  readonly images: ProfileImages;
  readonly tracks: readonly Track<P>[];
  readonly platforms: readonly PlatformLink<P>[];
  readonly youtube: ChannelIdentity<P>;
  readonly contact: { readonly email: string };
}

export type IambProfile = Profile<'iamb'>;
export type AimpProfile = Profile<'aimp'>;

export interface NavigationItem {
  readonly page: PageId;
  readonly labelKey: keyof UiDictionary['nav'];
}

export interface UiDictionary {
  readonly languageName: string;
  readonly navigationLabel: string;
  readonly nav: {
    readonly home: string;
    readonly music: string;
    readonly social: string;
    readonly socialShort: string;
    readonly about: string;
    readonly contact: string;
  };
  readonly actions: {
    readonly discoverMusic: string;
    readonly discoverLabel: string;
    readonly readStory: string;
    readonly skipToContent: string;
    readonly seeMore: string;
  };
  readonly sections: {
    readonly latestVideos: string;
    readonly platforms: string;
    readonly listeningPlatforms: string;
    readonly socialPlatforms: string;
    readonly artistPreview: string;
    readonly studio: string;
    readonly timeline: string;
    readonly inspiration: string;
  };
  readonly music: {
    readonly lead: string;
    readonly all: string;
    readonly entries: string;
    readonly columns: {
      readonly title: string;
      readonly source: string;
      readonly released: string;
      readonly length: string;
    };
    readonly openExternal: string;
    readonly filterLabel: string;
    readonly local: string;
    readonly rowMenu: string;
    readonly sortTitle: string;
    readonly sortReleased: string;
    readonly addToQueue: string;
    readonly openYouTube: string;
    readonly copyLink: string;
    readonly queued: string;
    readonly copied: string;
  };
  readonly social: {
    readonly lead: string;
  };
  readonly search: {
    readonly open: string;
    readonly label: string;
    readonly placeholder: string;
    readonly none: string;
    readonly close: string;
  };
  readonly player: {
    readonly region: string;
    readonly play: string;
    readonly pause: string;
    readonly previous: string;
    readonly next: string;
    readonly seek: string;
    readonly volume: string;
    readonly mute: string;
    readonly unmute: string;
    readonly error: string;
    readonly shuffleOn: string;
    readonly shuffleOff: string;
    readonly repeatOff: string;
    readonly repeatAll: string;
    readonly repeatOne: string;
    readonly expandArt: string;
    readonly collapseArt: string;
  };
  readonly video: {
    readonly close: string;
    readonly expand: string;
    readonly collapse: string;
    readonly dialogLabel: string;
    readonly unavailable: string;
    readonly empty: string;
    readonly updated: string;
  };
  readonly switches: {
    readonly profile: string;
    readonly active: string;
    readonly language: string;
    readonly toLight: string;
    readonly toDark: string;
  };
  readonly shell: {
    readonly groupMenu: string;
    readonly groupMore: string;
    readonly expandSources: string;
    readonly collapseSources: string;
    readonly collapseRail: string;
    readonly expandRail: string;
  };
  readonly notices: {
    readonly provisionalContent: string;
  };
}

export interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  loadVideoById(videoId: string): void;
  setVolume(level: number): void;
  mute(): void;
  unMute(): void;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

export interface YouTubeApi {
  Player: new (
    element: HTMLElement,
    options: {
      events: {
        onReady: () => void;
        onStateChange: (event: { data: number }) => void;
        onError: () => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: {
    PLAYING: number;
    PAUSED: number;
    ENDED: number;
    BUFFERING: number;
  };
}

export interface SoundCloudProgress {
  soundId?: number;
  currentPosition?: number;
  relativePosition?: number;
}

export interface SoundCloudWidget {
  bind(event: string, listener: (data?: SoundCloudProgress) => void): void;
  load(url: string, options: Record<string, boolean | number>): void;
  play(): void;
  skip(index: number): void;
  pause(): void;
  seekTo(milliseconds: number): void;
  setVolume(level: number): void;
  getDuration(callback: (milliseconds: number) => void): void;
  getSounds(callback: (sounds: { id: number }[]) => void): void;
  getCurrentSound(callback: (sound: { id: number } | null) => void): void;
}

export interface SoundCloudApi {
  Widget: {
    (iframe: HTMLIFrameElement): SoundCloudWidget;
    Events: Record<
      'READY' | 'PLAY' | 'PAUSE' | 'PLAY_PROGRESS' | 'FINISH' | 'ERROR',
      string
    >;
  };
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    SC?: SoundCloudApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeRequest: Promise<YouTubeApi> | null = null;
let soundcloudRequest: Promise<SoundCloudApi> | null = null;

export function youtubeApi(): Promise<YouTubeApi> {
  youtubeRequest ??= new Promise<YouTubeApi>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    window.onYouTubeIframeAPIReady = () => {
      if (window.YT) resolve(window.YT);
      else reject(new Error('YouTube'));
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => {
      script.remove();
      reject(new Error('YouTube'));
    };
    document.head.append(script);
  }).catch((error) => {
    youtubeRequest = null;
    throw error;
  });
  return youtubeRequest;
}

export function soundcloudApi(): Promise<SoundCloudApi> {
  soundcloudRequest ??= new Promise<SoundCloudApi>((resolve, reject) => {
    if (window.SC?.Widget) {
      resolve(window.SC);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.onload = () => {
      if (window.SC?.Widget) resolve(window.SC);
      else {
        script.remove();
        reject(new Error('SoundCloud'));
      }
    };
    script.onerror = () => {
      script.remove();
      reject(new Error('SoundCloud'));
    };
    document.head.append(script);
  }).catch((error) => {
    soundcloudRequest = null;
    throw error;
  });
  return soundcloudRequest;
}

import { embedUrl } from '../lib/youtube.ts';

interface LocalPlayable {
  kind: 'local';
  id: string;
  title: string;
  sources: { src: string; mimeType: string }[];
}

interface VideoPlayable {
  kind: 'youtube';
  id: string;
  title: string;
  videoId: string;
  thumbnail: string | null;
  durationSeconds: number | null;
}

type Playable = LocalPlayable | VideoPlayable;

interface YouTubePlayer {
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
  getPlayerState(): number;
  destroy(): void;
}

interface YouTubeApi {
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
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number };
}

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiRequest: Promise<YouTubeApi> | null = null;

function youtubeApi(): Promise<YouTubeApi> {
  apiRequest ??= new Promise<YouTubeApi>((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    window.onYouTubeIframeAPIReady = () => resolve(window.YT!);
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.append(tag);
  });
  return apiRequest;
}

const dock = document.querySelector<HTMLElement>('[data-player]');
const audio = document.querySelector<HTMLAudioElement>('[data-player-audio]');
const stage = document.querySelector<HTMLDialogElement>('[data-video-dialog]');
const frame = document.querySelector<HTMLElement>('[data-video-frame]');

function pick<T extends HTMLElement>(selector: string): T | null {
  return dock?.querySelector<T>(selector) ?? null;
}

if (dock && audio) {
  const payload = dock.querySelector('[data-playables]')?.textContent ?? '[]';
  const playables: Playable[] = JSON.parse(payload);
  const tracks = playables.filter((item): item is LocalPlayable => item.kind === 'local');

  const titleEl = pick('[data-player-title]');
  const artEl = pick('[data-player-art]');
  const sourceEl = pick('[data-player-source]');
  const toggle = pick<HTMLButtonElement>('[data-player-toggle]');
  const previous = pick<HTMLButtonElement>('[data-player-previous]');
  const next = pick<HTMLButtonElement>('[data-player-next]');
  const seek = pick<HTMLInputElement>('[data-player-seek]');
  const volume = pick<HTMLInputElement>('[data-player-volume]');
  const mute = pick<HTMLButtonElement>('[data-player-mute]');
  const elapsed = pick('[data-player-elapsed]');
  const duration = pick('[data-player-duration]');
  const error = pick('[data-player-error]');
  const stageToggle = pick<HTMLButtonElement>('[data-player-stage]');
  const stageClose = document.querySelector<HTMLButtonElement>('[data-video-close]');
  const shuffle = pick<HTMLButtonElement>('[data-player-shuffle]');
  const repeat = pick<HTMLButtonElement>('[data-player-repeat]');
  const status = pick('[data-player-status]');
  const artToggle = pick<HTMLButtonElement>('[data-player-art-toggle]');
  const artHtml = artEl?.innerHTML ?? '';

  const storageKey = `iambmusic-player-${dock.dataset['profile'] ?? ''}`;
  let index = 0;
  let mode: 'local' | 'youtube' = 'local';
  let video: VideoPlayable | null = null;
  let player: YouTubePlayer | null = null;
  let request = 0;
  let ticker = 0;
  let resumeAt = 0;
  let resumeLocal = 0;
  let muted = false;
  let switching = false;
  let frameEl: HTMLIFrameElement | null = null;
  let shuffled = false;
  let repeatMode: 'off' | 'all' | 'one' = 'off';
  let order: number[] = playables.map((_, position) => position);
  let queueMove = false;
  let manualQueue: string[] = [];
  let selectedId: string | null = null;
  let scrubbing = false;

  const clock = (seconds: number): string => {
    if (!Number.isFinite(seconds)) return '0:00';
    const whole = Math.max(0, Math.floor(seconds));
    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
  };

  function setFill(input: HTMLInputElement | null): void {
    if (!input) return;
    const max = Number(input.max) || 1;
    input.style.setProperty('--fill', `${(Number(input.value) / max) * 100}%`);
  }

  function setState(playing: boolean): void {
    dock!.dataset['state'] = playing ? 'playing' : 'paused';
    const label = playing ? toggle?.dataset['pause'] : toggle?.dataset['play'];
    if (label) toggle?.setAttribute('aria-label', label);
    syncRows();
  }

  function setQueue(enabled: boolean): void {
    previous?.toggleAttribute('hidden', !enabled);
    next?.toggleAttribute('hidden', !enabled);
  }

  function setProgress(current: number, total: number): void {
    if (elapsed && !scrubbing) elapsed.textContent = clock(current);
    if (duration) duration.textContent = clock(total);
    if (seek && !scrubbing) {
      seek.max = String(total || 0);
      seek.value = String(current);
      setFill(seek);
    }
  }

  function identify(item: { title: string; thumbnail?: string | null }, youtube: boolean): void {
    if (titleEl) titleEl.textContent = item.title;
    sourceEl?.toggleAttribute('hidden', !youtube);
    setQueue(playables.length > 1);
    if (artEl) {
      artEl.innerHTML = youtube && item.thumbnail ? `<img src="${item.thumbnail}" alt="">` : artHtml;
    }
    syncRows();
  }

  function announce(message: string | undefined): void {
    if (!status || !message) return;
    status.textContent = message;
  }

  function currentId(): string | null {
    return playables[index]?.id ?? null;
  }

  function syncRows(): void {
    const playingId = dock!.dataset['state'] === 'playing' ? currentId() : null;
    for (const row of document.querySelectorAll<HTMLElement>('[data-row-id]')) {
      const id = row.dataset['rowId'];
      const active = id === playingId;
      row.dataset['rowState'] = active ? 'playing' : 'paused';
      row.toggleAttribute('data-row-selected', id === selectedId);
      const button = row.querySelector<HTMLButtonElement>('[data-row-play]');
      const label = active ? button?.dataset['pause'] : button?.dataset['play'];
      if (label) button?.setAttribute('aria-label', label);
    }
  }

  function applyVolume(): void {
    const level = Number(volume?.value ?? 0.5);
    audio!.volume = level;
    audio!.muted = muted;
    if (player) {
      player.setVolume(Math.round(level * 100));
      if (muted) player.mute();
      else player.unMute();
    }
    dock!.dataset['muted'] = String(muted);
    const label = muted ? mute?.dataset['unmute'] : mute?.dataset['mute'];
    if (label) mute?.setAttribute('aria-label', label);
    setFill(volume);
  }

  function showError(message: string | undefined): void {
    if (!error || !message) return;
    error.textContent = message;
    error.removeAttribute('hidden');
  }

  function currentTime(): number {
    if (mode !== 'youtube') return audio!.currentTime;
    return player ? player.getCurrentTime() : resumeAt;
  }

  function remember(): void {
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          mode,
          index,
          videoId: video?.videoId,
          time: currentTime(),
          shuffled,
          repeatMode,
          order,
          manualQueue,
        }),
      );
    } catch {
      // a blocked storage API must not break playback
    }
  }

  function stopTicker(): void {
    clearInterval(ticker);
    ticker = 0;
  }

  function startTicker(): void {
    stopTicker();
    ticker = window.setInterval(() => {
      if (!player) return;
      setProgress(player.getCurrentTime(), player.getDuration());
    }, 500);
  }

  function releasePlayer(): void {
    stopTicker();
    request += 1;
    if (player) {
      player.stopVideo();
      player.destroy();
      player = null;
    }
    frameEl = null;
    frame?.replaceChildren();
  }

  function clearVideo(): void {
    releasePlayer();
    video = null;
    resumeAt = 0;
    stageToggle?.setAttribute('hidden', '');
    if (stage?.open) {
      switching = true;
      stage.close();
    }
    stage?.removeAttribute('data-mode');
    document.documentElement.style.overflow = '';
  }

  function queueIndexOf(id: string): number {
    return playables.findIndex((entry) => entry.id === id);
  }

  function loadTrack(track: LocalPlayable, play: boolean): void {
    clearVideo();
    mode = 'local';
    index = queueIndexOf(track.id);
    if (shuffled && !queueMove) rebuildOrder();

    audio!.replaceChildren(
      ...track.sources.map((source) => {
        const element = document.createElement('source');
        element.src = source.src;
        element.type = source.mimeType;
        return element;
      }),
    );
    identify(track, false);
    error?.setAttribute('hidden', '');
    audio!.load();
    if (play) void audio!.play();
    remember();
  }

  function showStage(expanded: boolean): void {
    if (!stage) return;
    if (stage.open) {
      switching = true;
      stage.close();
    }
    stage.dataset['mode'] = expanded ? 'expanded' : 'compact';
    if (expanded) {
      document.documentElement.style.overflow = 'hidden';
      stage.showModal();
    } else {
      document.documentElement.style.overflow = '';
      stage.show();
    }
    const label = expanded ? stageToggle?.dataset['collapse'] : stageToggle?.dataset['expand'];
    if (label) stageToggle?.setAttribute('aria-label', label);
  }

  function selectVideo(item: VideoPlayable, startSeconds: number): void {
    audio!.pause();
    mode = 'youtube';
    video = item;
    index = queueIndexOf(item.id);
    if (shuffled && !queueMove) rebuildOrder();
    resumeAt = startSeconds;
    identify(item, true);
    error?.setAttribute('hidden', '');
    setProgress(startSeconds, item.durationSeconds ?? 0);
    setState(false);
    remember();
  }

  async function playVideo(item: VideoPlayable, expanded = false, startSeconds = 0): Promise<void> {
    if (!stage || !frame) return;
    releasePlayer();
    selectVideo(item, startSeconds);
    stageToggle?.removeAttribute('hidden');
    showStage(expanded);

    const token = request;
    const iframe = document.createElement('iframe');
    frameEl = iframe;
    iframe.src = embedUrl(item.videoId, location.origin);
    iframe.title = item.title;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    frame.append(iframe);

    const api = await youtubeApi();
    if (token !== request) return;

    player = new api.Player(iframe, {
      events: {
        onReady: () => {
          if (token !== request) return;
          applyVolume();
          if (resumeAt > 0) player?.seekTo(resumeAt, true);
          player?.playVideo();
        },
        onStateChange: (event) => {
          if (token !== request || !player) return;
          const started = event.data === api.PlayerState.PLAYING;
          setState(started || event.data === api.PlayerState.BUFFERING);
          setProgress(player.getCurrentTime(), player.getDuration());
          if (started) startTicker();
          else if (event.data !== api.PlayerState.BUFFERING) {
            stopTicker();
            remember();
            if (event.data === api.PlayerState.ENDED) advance();
          }
        },
        onError: () => {
          if (token !== request) return;
          stopTicker();
          setState(false);
          showError(error?.dataset['video']);
        },
      },
    });
  }

  toggle?.addEventListener('click', () => {
    if (mode === 'youtube') {
      if (!video) return;
      if (!player) {
        void playVideo(video, false, resumeAt);
        return;
      }
      if (dock.dataset['state'] === 'playing') player.pauseVideo();
      else player.playVideo();
      return;
    }
    if (audio.paused) void audio.play();
    else audio.pause();
  });

  function playing(): boolean {
    return dock!.dataset['state'] === 'playing';
  }

  function rebuildOrder(): void {
    if (!shuffled) {
      order = playables.map((_, position) => position);
      return;
    }
    const rest = playables
      .map((_, position) => position)
      .filter((position) => position !== index);
    for (let i = rest.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j]!, rest[i]!];
    }
    order = [index, ...rest];
  }

  function neighbour(delta: number): number | undefined {
    const size = order.length;
    if (size < 2) return undefined;
    const at = order.indexOf(index);
    return order[(at + delta + size) % size];
  }

  function setShuffle(on: boolean): void {
    shuffled = on;
    rebuildOrder();
    shuffle?.setAttribute('aria-pressed', String(on));
    const label = on ? shuffle?.dataset['on'] : shuffle?.dataset['off'];
    if (label) shuffle?.setAttribute('aria-label', label);
    remember();
  }

  function setRepeat(mode: 'off' | 'all' | 'one'): void {
    repeatMode = mode;
    repeat?.setAttribute('data-repeat', mode);
    const label = repeat?.dataset[mode];
    if (label) repeat?.setAttribute('aria-label', label);
    remember();
  }

  function selectAt(next: number, play: boolean): void {
    const item = playables[next];
    if (!item) return;
    queueMove = true;
    try {
      selectItem(item, next, play);
    } finally {
      queueMove = false;
    }
  }

  function selectItem(item: Playable, next: number, play: boolean): void {
    if (item.kind === 'local') {
      loadTrack(item, play);
      return;
    }
    if (play && player && stage?.open) {
      video = item;
      index = next;
      resumeAt = 0;
      if (frameEl) frameEl.title = item.title;
      identify(item, true);
      setProgress(0, item.durationSeconds ?? 0);
      player.loadVideoById(item.videoId);
      remember();
      return;
    }
    if (play) {
      void playVideo(item);
      return;
    }
    clearVideo();
    selectVideo(item, 0);
  }

  function takeQueued(): number | undefined {
    while (manualQueue.length > 0) {
      const id = manualQueue.shift()!;
      const at = queueIndexOf(id);
      if (at >= 0) {
        remember();
        return at;
      }
    }
    return undefined;
  }

  function step(delta: number): void {
    const queued = delta > 0 ? takeQueued() : undefined;
    const target = queued ?? neighbour(delta);
    if (target === undefined) return;
    selectAt(target, playing());
  }

  function advance(): void {
    if (repeatMode === 'one') {
      selectAt(index, true);
      return;
    }
    const queued = takeQueued();
    if (queued !== undefined) {
      selectAt(queued, true);
      return;
    }
    const target = neighbour(1);
    if (target === undefined) return;
    if (repeatMode === 'off' && order.indexOf(index) === order.length - 1) {
      setState(false);
      return;
    }
    selectAt(target, true);
  }

  previous?.addEventListener('click', () => step(-1));
  next?.addEventListener('click', () => step(1));

  shuffle?.addEventListener('click', () => setShuffle(!shuffled));
  repeat?.addEventListener('click', () => {
    setRepeat(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off');
  });

  stageToggle?.addEventListener('click', () => {
    if (!video) return;
    showStage(stage?.dataset['mode'] !== 'expanded');
  });

  document.querySelector('[data-video-collapse]')?.addEventListener('click', () => {
    if (video) showStage(false);
  });

  stageClose?.addEventListener('click', () => {
    remember();
    clearVideo();
    setState(false);
  });

  stage?.addEventListener('close', () => {
    if (switching) {
      switching = false;
      return;
    }
    remember();
    clearVideo();
    setState(false);
  });

  audio.addEventListener('play', () => {
    if (mode === 'local') setState(true);
  });
  audio.addEventListener('pause', () => {
    if (mode === 'local') setState(false);
  });
  audio.addEventListener('ended', () => {
    if (mode === 'local') advance();
  });
  audio.addEventListener('error', () => showError(error?.dataset['track']));

  audio.addEventListener('loadedmetadata', () => {
    if (mode !== 'local') return;
    if (resumeLocal > 0) {
      audio.currentTime = resumeLocal;
      resumeLocal = 0;
    }
    setProgress(audio.currentTime, audio.duration);
  });

  audio.addEventListener('timeupdate', () => {
    if (mode !== 'local') return;
    setProgress(audio.currentTime, audio.duration);
  });

  seek?.addEventListener('pointerdown', () => {
    scrubbing = true;
  });

  seek?.addEventListener('input', () => {
    scrubbing = true;
    setFill(seek);
    if (elapsed) elapsed.textContent = clock(Number(seek.value));
    if (mode === 'local') audio.currentTime = Number(seek.value);
  });

  seek?.addEventListener('change', () => {
    scrubbing = false;
    if (mode === 'youtube') player?.seekTo(Number(seek.value), true);
  });

  for (const event of ['pointerup', 'pointercancel', 'keyup', 'blur'] as const) {
    seek?.addEventListener(event, () => {
      scrubbing = false;
    });
  }

  volume?.addEventListener('input', () => {
    if (Number(volume.value) > 0) muted = false;
    applyVolume();
  });

  mute?.addEventListener('click', () => {
    muted = !muted;
    applyVolume();
  });

  addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !video) return;
    if (stage?.dataset['mode'] !== 'compact') return;
    remember();
    clearVideo();
    setState(false);
  });

  addEventListener('pagehide', () => {
    remember();
    clearVideo();
  });

  function startById(id: string): void {
    const at = queueIndexOf(id);
    if (at < 0) return;
    selectedId = id;
    selectAt(at, true);
  }

  function setArt(expanded: boolean): void {
    dock!.dataset['art'] = expanded ? 'expanded' : 'compact';
    artToggle?.setAttribute('aria-expanded', String(expanded));
    const label = expanded ? artToggle?.dataset['collapse'] : artToggle?.dataset['expand'];
    if (label) artToggle?.setAttribute('aria-label', label);
  }

  artToggle?.addEventListener('click', () => setArt(dock.dataset['art'] !== 'expanded'));

  const wideShell = matchMedia('(min-width: 60rem)');
  wideShell.addEventListener('change', (event) => {
    if (!event.matches) setArt(false);
  });

  document.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    const target = event.target as Element | null;

    const play = target?.closest<HTMLElement>('[data-row-play]');
    if (play) {
      event.preventDefault();
      const id = play.dataset['rowPlay']!;
      selectedId = id;
      syncRows();
      if (id === currentId()) toggle?.click();
      else startById(id);
      return;
    }

    const enqueue = target?.closest<HTMLElement>('[data-row-enqueue]');
    if (enqueue) {
      manualQueue.push(enqueue.dataset['rowEnqueue']!);
      remember();
      announce(dock.dataset['queued']);
      enqueue.closest<HTMLElement>('[popover]')?.hidePopover();
      return;
    }

    const copy = target?.closest<HTMLElement>('[data-row-copy]');
    if (copy) {
      void navigator.clipboard.writeText(copy.dataset['rowCopy']!).then(() => {
        announce(dock.dataset['copied']);
      });
      copy.closest<HTMLElement>('[popover]')?.hidePopover();
      return;
    }

    const select = target?.closest<HTMLElement>('[data-row-select]');
    if (select) {
      event.preventDefault();
      selectedId = select.dataset['rowSelect']!;
      syncRows();
      return;
    }
  });

  document.addEventListener('dblclick', (event) => {
    const select = (event.target as Element | null)?.closest<HTMLElement>('[data-row-select]');
    if (!select) return;
    event.preventDefault();
    startById(select.dataset['rowSelect']!);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const select = (event.target as Element | null)?.closest<HTMLElement>('[data-row-select]');
    if (!select) return;
    event.preventDefault();
    selectedId = select.dataset['rowSelect']!;
    syncRows();
  });

  let restored: Playable | undefined;
  let savedTime = 0;
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
    savedTime = Number(saved?.time) || 0;
    if (saved?.shuffled === true) shuffled = true;
    if (saved?.repeatMode === 'all' || saved?.repeatMode === 'one') repeatMode = saved.repeatMode;
    if (Array.isArray(saved?.order) && saved.order.length === playables.length) order = saved.order;
    if (Array.isArray(saved?.manualQueue)) manualQueue = saved.manualQueue.filter((id: unknown) => typeof id === 'string');
    if (saved?.mode === 'youtube') {
      restored = playables.find(
        (entry) => entry.kind === 'youtube' && entry.videoId === saved.videoId,
      );
    } else if (saved?.mode === 'local' && typeof saved.index === 'number') {
      const candidate = playables[saved.index];
      if (candidate?.kind === 'local') restored = candidate;
    }
  } catch {
    // ignore an unreadable session value
  }

  setState(false);
  applyVolume();
  setShuffle(shuffled);
  setRepeat(repeatMode);
  document.addEventListener('astro:page-load', syncRows);

  const first = tracks[0];
  if (restored?.kind === 'youtube') {
    if (first) loadTrack(first, false);
    selectVideo(restored, savedTime);
  } else {
    resumeLocal = savedTime;
    const start = restored?.kind === 'local' ? restored : first;
    if (start) loadTrack(start, false);
  }
}

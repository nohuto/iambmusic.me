import { embedUrl } from '../lib/youtube.ts';
import type {
  Playable,
  PlayableSoundCloud,
  PlayableTrack,
  PlayableVideo,
} from '../lib/playable.ts';
import {
  soundcloudApi,
  youtubeApi,
  type SoundCloudApi,
  type SoundCloudWidget,
  type YouTubePlayer,
} from './player-apis.ts';

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
  const items = new Map(playables.map((item) => [item.id, item]));
  const tracks = playables.filter((item): item is PlayableTrack => item.kind === 'local');

  const titleEl = pick('[data-player-title]');
  const artEl = pick('[data-player-art]');
  const sourceEl = pick('[data-player-source]');
  let soundcloudFrame = pick<HTMLIFrameElement>('[data-soundcloud-frame]');
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
  let current: Playable = tracks[0]!;
  let player: YouTubePlayer | null = null;
  let soundcloudPlayer: SoundCloudWidget | null = null;
  let remotePosition = 0;
  let remoteDuration = 0;
  let playbackWanted = false;
  let soundcloudStartTimer = 0;
  let starting = false;
  let youtubeReady = false;
  let request = 0;
  let ticker = 0;
  let resumeLocal = 0;
  let muted = false;
  let switching = false;
  let shuffled = false;
  let repeatMode: 'off' | 'all' | 'one' = 'off';
  let sequence = playables.map((item) => item.id);
  let order = [...sequence];
  let queueContextLocked = false;
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

  function setSkipAvailable(enabled: boolean): void {
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

  function identify(
    item: { title: string; thumbnail?: string | null; url?: string },
    source: 'youtube' | 'soundcloud' | null,
  ): void {
    if (titleEl) titleEl.textContent = item.title;
    sourceEl?.toggleAttribute('hidden', source === null);
    if (sourceEl instanceof HTMLAnchorElement && source) {
      sourceEl.href = item.url ?? '#';
      const label = sourceEl.querySelector<HTMLElement>('[data-player-source-label]');
      if (label) label.textContent = source === 'youtube' ? 'YouTube' : 'SoundCloud';
      for (const icon of sourceEl.querySelectorAll<HTMLElement>('[data-player-source-icon]')) {
        icon.style.display = icon.dataset['playerSourceIcon'] === source ? 'block' : 'none';
      }
    }
    if (artEl) {
      artEl.innerHTML = source && item.thumbnail ? `<img src="${item.thumbnail}" alt="">` : artHtml;
    }
  }

  function announce(message: string | undefined): void {
    if (!status || !message) return;
    status.textContent = message;
  }

  function syncRows(): void {
    const playingId = dock!.dataset['state'] === 'playing' ? current.id : null;
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
    soundcloudPlayer?.setVolume(muted ? 0 : Math.round(level * 100));
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

  function failPlayback(message: string | undefined): void {
    playbackWanted = false;
    starting = false;
    setState(false);
    showError(message);
    remember();
  }

  function currentTime(): number {
    if (current.kind === 'youtube') return player ? player.getCurrentTime() : remotePosition;
    if (current.kind === 'soundcloud') return remotePosition;
    return audio!.currentTime;
  }

  function remember(): void {
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          itemId: current.id,
          time: currentTime(),
          shuffled,
          repeatMode,
          sequence: queueContextLocked ? sequence : undefined,
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
    youtubeReady = false;
    starting = false;
    if (player) {
      player.stopVideo();
      player.destroy();
      player = null;
    }
    frame?.replaceChildren();
  }

  function hideStage(): void {
    stageToggle?.setAttribute('hidden', '');
    if (stage?.open) {
      switching = true;
      stage.close();
    }
    stage?.removeAttribute('data-mode');
    document.documentElement.style.overflow = '';
  }

  function clearVideo(): void {
    releasePlayer();
    hideStage();
  }

  function clearSoundCloud(): void {
    const resetProgress = current.kind === 'soundcloud';
    window.clearTimeout(soundcloudStartTimer);
    starting = false;
    soundcloudPlayer?.pause();
    soundcloudPlayer = null;
    if (resetProgress) {
      remotePosition = 0;
      remoteDuration = 0;
    }
  }

  function closeVideo(): void {
    playbackWanted = false;
    starting = false;
    const at = player?.getCurrentTime();
    if (typeof at === 'number' && Number.isFinite(at) && at >= 0) remotePosition = at;
    releasePlayer();
    hideStage();
    setState(false);
    setProgress(remotePosition, current.durationSeconds ?? 0);
    remember();
  }

  function setCurrent(item: Playable, startSeconds: number, shouldPlay: boolean): void {
    current = item;
    playbackWanted = shouldPlay;
    starting = shouldPlay && item.kind !== 'local';
    remotePosition = startSeconds;
    remoteDuration = item.durationSeconds ?? 0;
    identify(item, item.kind === 'local' ? null : item.kind);
    error?.setAttribute('hidden', '');
    setProgress(startSeconds, remoteDuration);
    setState(false);
    remember();
  }

  function loadTrack(track: PlayableTrack, play: boolean): void {
    clearVideo();
    clearSoundCloud();

    audio!.replaceChildren(
      ...track.sources.map((source) => {
        const element = document.createElement('source');
        element.src = source.src;
        element.type = source.mimeType;
        return element;
      }),
    );
    audio!.load();
    setCurrent(track, 0, play);
    if (play) playLocal();
  }

  function playLocal(): void {
    const id = current.id;
    error?.setAttribute('hidden', '');
    void audio!.play().catch(() => {
      if (current.kind !== 'local' || current.id !== id) return;
      failPlayback(error?.dataset['track']);
    });
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

  function selectVideo(item: PlayableVideo, startSeconds: number, shouldPlay = false): void {
    audio!.pause();
    clearSoundCloud();
    setCurrent(item, startSeconds, shouldPlay);
  }

  async function playVideo(item: PlayableVideo, expanded = false, startSeconds = 0): Promise<void> {
    if (!stage || !frame) return;
    releasePlayer();
    selectVideo(item, startSeconds, true);
    stageToggle?.removeAttribute('hidden');
    showStage(expanded);

    const token = request;
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl(item.videoId, location.origin);
    iframe.title = item.title;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    frame.append(iframe);

    try {
      const api = await youtubeApi();
      if (token !== request) return;

      player = new api.Player(iframe, {
        events: {
          onReady: () => {
            if (token !== request || current.id !== item.id) return;
            youtubeReady = true;
            applyVolume();
            if (remotePosition > 0) player?.seekTo(remotePosition, true);
            if (playbackWanted) {
              player?.playVideo();
              starting = false;
            }
          },
          onStateChange: (event) => {
            if (token !== request || current.id !== item.id || !player) return;
            const started = event.data === api.PlayerState.PLAYING;
            const buffering = event.data === api.PlayerState.BUFFERING;
            if (started) {
              starting = false;
              playbackWanted = true;
            } else if (buffering) {
              starting = false;
            } else if (event.data === api.PlayerState.PAUSED && !starting) {
              playbackWanted = false;
            }
            setState(playbackWanted && (started || buffering));
            setProgress(player.getCurrentTime(), player.getDuration());
            if (started) startTicker();
            else if (!buffering) {
              stopTicker();
              remember();
              if (event.data === api.PlayerState.ENDED) advance();
            }
          },
          onError: () => {
            if (token !== request || current.id !== item.id) return;
            releasePlayer();
            failPlayback(error?.dataset['video']);
          },
        },
      });
    } catch {
      if (token !== request) return;
      failPlayback(error?.dataset['video']);
    }
  }

  function selectSoundCloud(
    item: PlayableSoundCloud,
    startSeconds: number,
    shouldPlay = false,
  ): void {
    audio!.pause();
    clearVideo();
    clearSoundCloud();
    setCurrent(item, startSeconds, shouldPlay);
  }

  function soundcloudUrl(url: string): string {
    const embed = new URL('https://w.soundcloud.com/player/');
    embed.searchParams.set('url', url);
    for (const key of [
      'buying',
      'sharing',
      'download',
      'show_artwork',
      'show_playcount',
      'show_user',
    ]) {
      embed.searchParams.set(key, 'false');
    }
    embed.searchParams.set('auto_play', 'true');
    return embed.href;
  }

  function waitForSoundCloudProgress(widget: SoundCloudWidget, url: string): void {
    window.clearTimeout(soundcloudStartTimer);
    soundcloudStartTimer = window.setTimeout(() => {
      if (
        soundcloudPlayer !== widget ||
        current.kind !== 'soundcloud' ||
        current.url !== url ||
        playing()
      ) return;
      widget.pause();
      failPlayback(undefined);
    }, 5000);
  }

  function bindSoundCloud(api: SoundCloudApi, widget: SoundCloudWidget, url: string): void {
    const events = api.Widget.Events;
    const isCurrentSound = (): boolean =>
      current.kind === 'soundcloud' && current.url === url && soundcloudPlayer === widget;

    widget.bind(events.READY, () => {
      if (!isCurrentSound()) return;
      applyVolume();
      widget.getDuration((milliseconds) => {
        if (!isCurrentSound()) return;
        remoteDuration = milliseconds / 1000 || current.durationSeconds || 0;
        setProgress(remotePosition, remoteDuration);
      });
      if (remotePosition > 0) widget.seekTo(remotePosition * 1000);
      requestSoundCloudPlayback(widget, url);
    });
    widget.bind(events.PAUSE, () => {
      if (!isCurrentSound()) return;
      if (!starting) playbackWanted = false;
      if (!playbackWanted) window.clearTimeout(soundcloudStartTimer);
      setState(false);
      remember();
    });
    widget.bind(events.PLAY_PROGRESS, (data) => {
      if (!isCurrentSound() || typeof data?.currentPosition !== 'number') return;
      window.clearTimeout(soundcloudStartTimer);
      if (playbackWanted) {
        starting = false;
        if (!playing()) setState(true);
      }
      remotePosition = data.currentPosition / 1000;
      setProgress(remotePosition, remoteDuration || current.durationSeconds || 0);
    });
    widget.bind(events.FINISH, () => {
      if (!isCurrentSound()) return;
      window.clearTimeout(soundcloudStartTimer);
      advance();
    });
    widget.bind(events.ERROR, () => {
      if (!isCurrentSound()) return;
      window.clearTimeout(soundcloudStartTimer);
      soundcloudPlayer = null;
      failPlayback(error?.dataset['track']);
    });
  }

  function requestSoundCloudPlayback(widget: SoundCloudWidget, url: string): void {
    if (
      !playbackWanted ||
      soundcloudPlayer !== widget ||
      current.kind !== 'soundcloud' ||
      current.url !== url
    ) return;
    widget.play();
    waitForSoundCloudProgress(widget, url);
  }

  async function playSoundCloud(item: PlayableSoundCloud, startSeconds = 0): Promise<void> {
    if (!soundcloudFrame) return;
    selectSoundCloud(item, startSeconds, true);

    const replacement = soundcloudFrame.cloneNode(false) as HTMLIFrameElement;
    replacement.src = soundcloudUrl(item.url);
    soundcloudFrame.replaceWith(replacement);
    soundcloudFrame = replacement;
    soundcloudPlayer = null;

    try {
      const api = window.SC?.Widget ? window.SC : await soundcloudApi();
      if (current.id !== item.id || soundcloudFrame !== replacement) return;

      soundcloudPlayer = api.Widget(replacement);
      bindSoundCloud(api, soundcloudPlayer, item.url);
      requestSoundCloudPlayback(soundcloudPlayer, item.url);
    } catch {
      if (current.id !== item.id || soundcloudFrame !== replacement) return;
      window.clearTimeout(soundcloudStartTimer);
      failPlayback(error?.dataset['track']);
    }
  }

  function pauseCurrent(): void {
    playbackWanted = false;
    starting = false;
    window.clearTimeout(soundcloudStartTimer);
    if (current.kind === 'youtube') player?.pauseVideo();
    else if (current.kind === 'soundcloud') soundcloudPlayer?.pause();
    else audio!.pause();
    setState(false);
  }

  function resumeCurrent(): void {
    adoptVisibleSequence(current.id);
    playbackWanted = true;
    starting = current.kind !== 'local';
    error?.setAttribute('hidden', '');
    if (current.kind === 'youtube') {
      if (!player || !youtubeReady) void playVideo(current, false, remotePosition);
      else player.playVideo();
    } else if (current.kind === 'soundcloud') {
      if (!soundcloudPlayer) void playSoundCloud(current, remotePosition);
      else requestSoundCloudPlayback(soundcloudPlayer, current.url);
    } else {
      playLocal();
    }
  }

  toggle?.addEventListener('click', () => {
    if (playbackWanted) pauseCurrent();
    else resumeCurrent();
  });

  function playing(): boolean {
    return dock!.dataset['state'] === 'playing';
  }

  function rebuildOrder(): void {
    if (!shuffled) {
      order = [...sequence];
      setSkipAvailable(order.length > 1);
      return;
    }
    const rest = sequence.filter((id) => id !== current.id);
    for (let i = rest.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j]!, rest[i]!];
    }
    order = sequence.includes(current.id) ? [current.id, ...rest] : rest;
    setSkipAvailable(order.length > 1);
  }

  function visibleSequence(): string[] {
    return [...document.querySelectorAll<HTMLElement>('[data-row-id][data-playable]')]
      .filter((row) => !row.closest<HTMLElement>('[data-media-row]')?.hidden)
      .map((row) => row.dataset['rowId'] ?? '')
      .filter((id, at, ids) => items.has(id) && ids.indexOf(id) === at);
  }

  function syncSequence(): void {
    if (queueContextLocked) return;
    const visible = visibleSequence();
    if (visible.length === 0) return;
    sequence = visible;
    rebuildOrder();
  }

  function adoptVisibleSequence(id: string, replace = false): void {
    if (queueContextLocked && !replace) return;
    const visible = visibleSequence();
    if (!visible.includes(id)) return;
    sequence = visible;
    queueContextLocked = true;
    rebuildOrder();
    remember();
  }

  function neighbour(delta: number): string | undefined {
    const size = order.length;
    if (size === 0) return undefined;
    const at = order.indexOf(current.id);
    if (at < 0) return delta > 0 ? order[0] : order[size - 1];
    if (size < 2) return undefined;
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

  function selectById(id: string, play: boolean): void {
    const item = items.get(id);
    if (item) selectItem(item, play);
  }

  function selectItem(item: Playable, play: boolean): void {
    if (item.kind === 'local') {
      loadTrack(item, play);
      return;
    }
    if (item.kind === 'soundcloud') {
      if (play) void playSoundCloud(item);
      else selectSoundCloud(item, 0);
      return;
    }
    if (play && player && youtubeReady && stage?.open) {
      playbackWanted = true;
      starting = true;
      current = item;
      remotePosition = 0;
      remoteDuration = item.durationSeconds ?? 0;
      const iframe = frame?.querySelector<HTMLIFrameElement>('iframe');
      if (iframe) iframe.title = item.title;
      identify(item, 'youtube');
      setProgress(0, remoteDuration);
      syncRows();
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

  function takeQueued(): string | undefined {
    while (manualQueue.length > 0) {
      const id = manualQueue.shift()!;
      if (items.has(id)) {
        remember();
        return id;
      }
    }
    return undefined;
  }

  function step(delta: number): void {
    const queued = delta > 0 ? takeQueued() : undefined;
    const target = queued ?? neighbour(delta);
    if (target === undefined) return;
    selectById(target, playbackWanted);
  }

  function advance(): void {
    if (!playbackWanted) {
      setState(false);
      return;
    }
    if (repeatMode === 'one') {
      selectById(current.id, true);
      return;
    }
    const queued = takeQueued();
    if (queued !== undefined) {
      selectById(queued, true);
      return;
    }
    const target = neighbour(1);
    if (target === undefined) return;
    if (repeatMode === 'off' && order.indexOf(current.id) === order.length - 1) {
      playbackWanted = false;
      setState(false);
      return;
    }
    selectById(target, true);
  }

  previous?.addEventListener('click', () => step(-1));
  next?.addEventListener('click', () => step(1));

  shuffle?.addEventListener('click', () => setShuffle(!shuffled));
  repeat?.addEventListener('click', () => {
    setRepeat(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off');
  });

  stageToggle?.addEventListener('click', () => {
    if (current.kind !== 'youtube') return;
    showStage(stage?.dataset['mode'] !== 'expanded');
  });

  document.querySelector('[data-video-collapse]')?.addEventListener('click', () => {
    if (current.kind === 'youtube') showStage(false);
  });

  stageClose?.addEventListener('click', () => {
    closeVideo();
  });

  stage?.addEventListener('close', () => {
    if (switching) {
      switching = false;
      return;
    }
    closeVideo();
  });

  audio.addEventListener('play', () => {
    if (current.kind !== 'local') return;
    if (!playbackWanted) {
      audio.pause();
      return;
    }
    setState(true);
  });
  audio.addEventListener('pause', () => {
    if (current.kind === 'local') setState(false);
  });
  audio.addEventListener('ended', () => {
    if (current.kind === 'local') advance();
  });
  audio.addEventListener('error', () => {
    if (current.kind !== 'local') return;
    failPlayback(error?.dataset['track']);
  });

  audio.addEventListener('loadedmetadata', () => {
    if (current.kind !== 'local') return;
    if (resumeLocal > 0) {
      audio.currentTime = resumeLocal;
      resumeLocal = 0;
    }
    setProgress(audio.currentTime, audio.duration);
  });

  audio.addEventListener('timeupdate', () => {
    if (current.kind !== 'local') return;
    setProgress(audio.currentTime, audio.duration);
  });

  seek?.addEventListener('pointerdown', () => {
    scrubbing = true;
  });

  seek?.addEventListener('input', () => {
    scrubbing = true;
    setFill(seek);
    if (elapsed) elapsed.textContent = clock(Number(seek.value));
    if (current.kind === 'local') audio.currentTime = Number(seek.value);
  });

  seek?.addEventListener('change', () => {
    scrubbing = false;
    if (current.kind === 'youtube') player?.seekTo(Number(seek.value), true);
    if (current.kind === 'soundcloud') {
      remotePosition = Number(seek.value);
      soundcloudPlayer?.seekTo(remotePosition * 1000);
    }
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

  function blocksPlayerShortcut(target: EventTarget | null): boolean {
    if (document.querySelector('[data-search-dialog][open], :popover-open')) return true;
    return (
      target instanceof Element &&
      target.closest(
        'input, textarea, select, button, a, [contenteditable], [role="textbox"], [role="option"]',
      ) !== null
    );
  }

  function changeVolume(delta: number): void {
    if (!volume) return;
    const level = Math.max(0, Math.min(1, Math.round((Number(volume.value) + delta) * 20) / 20));
    volume.value = String(level);
    if (level > 0) muted = false;
    applyVolume();
    announce(`${volume.getAttribute('aria-label') ?? ''}: ${Math.round(level * 100)}%`);
  }

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || blocksPlayerShortcut(event.target)) return;
    const command = event.ctrlKey || event.metaKey;

    if (command && !event.altKey && !event.shiftKey) {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        if (!event.repeat) step(event.key === 'ArrowLeft' ? -1 : 1);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        changeVolume(event.key === 'ArrowUp' ? 0.05 : -0.05);
      }
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (event.code === 'Space') {
      event.preventDefault();
      if (!event.repeat) toggle?.click();
    } else if (event.key.toLowerCase() === 'm') {
      event.preventDefault();
      if (!event.repeat) mute?.click();
    }
  });

  addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || current.kind !== 'youtube') return;
    if (stage?.dataset['mode'] !== 'compact') return;
    closeVideo();
  });

  addEventListener('pagehide', () => {
    remember();
    clearVideo();
    clearSoundCloud();
  });

  function startById(id: string): void {
    if (!items.has(id)) return;
    selectedId = id;
    selectById(id, true);
    adoptVisibleSequence(id, true);
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
      if (id === current.id) toggle?.click();
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

  function readId(value: unknown): string | null {
    if (typeof value === 'string' && items.has(value)) return value;
    if (typeof value === 'number' && Number.isInteger(value)) return playables[value]?.id ?? null;
    return null;
  }

  function readIds(value: unknown): string[] | null {
    if (!Array.isArray(value)) return null;
    const ids = value.map(readId);
    if (ids.some((id) => id === null)) return null;
    const valid = ids as string[];
    if (new Set(valid).size !== valid.length) return null;
    return valid;
  }

  let restored: Playable | undefined;
  let savedTime = 0;
  let savedSequence: string[] | null = null;
  let savedOrder: string[] | null = null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null') as Record<
      string,
      unknown
    > | null;
    savedTime = Number(saved?.['time']) || 0;
    shuffled = saved?.['shuffled'] === true;
    const savedRepeat = saved?.['repeatMode'];
    if (savedRepeat === 'all' || savedRepeat === 'one') repeatMode = savedRepeat;
    savedSequence = readIds(saved?.['sequence']);
    savedOrder = readIds(saved?.['order']);
    if (Array.isArray(saved?.['manualQueue'])) {
      manualQueue = saved['manualQueue']
        .map(readId)
        .filter((id): id is string => id !== null);
    }

    const itemId = readId(saved?.['itemId']);
    if (itemId) restored = items.get(itemId);
    if (!restored && typeof saved?.['videoId'] === 'string') {
      restored = playables.find(
        (item) => item.kind === 'youtube' && item.videoId === saved['videoId'],
      );
    }
    if (!restored && saved?.['mode'] === 'local') {
      const legacyId = readId(saved?.['index']);
      const legacyItem = legacyId ? items.get(legacyId) : undefined;
      if (legacyItem?.kind === 'local') restored = legacyItem;
    }
  } catch {
    // ignore an unreadable session value
  }

  if (savedSequence && restored && savedSequence.includes(restored.id)) {
    sequence = savedSequence;
    queueContextLocked = true;
  }

  setState(false);
  applyVolume();
  syncSequence();

  const first = tracks[0];
  if (restored?.kind === 'youtube') {
    selectVideo(restored, savedTime);
  } else if (restored?.kind === 'soundcloud') {
    selectSoundCloud(restored, savedTime);
  } else {
    resumeLocal = savedTime;
    const start = restored?.kind === 'local' ? restored : first;
    if (start) loadTrack(start, false);
  }

  setShuffle(shuffled);
  setRepeat(repeatMode);

  if (
    shuffled &&
    savedOrder?.length === sequence.length &&
    savedOrder.every((id) => sequence.includes(id))
  ) {
    order = [...savedOrder];
    setSkipAvailable(order.length > 1);
    remember();
  }

  document.addEventListener('iamb:rows-changed', syncSequence);
  document.addEventListener('astro:page-load', () => {
    syncSequence();
    syncRows();
  });
}

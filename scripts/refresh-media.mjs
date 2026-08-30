import { access, copyFile, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const API_ROOT = 'https://www.googleapis.com/youtube/v3';
const PAGE_SIZE = 50;
const STATUS_BATCH = 50;
const HOME_COUNT = 4;
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const HANDLE_PATTERN = /^@[A-Za-z0-9_.-]{3,30}$/;
const CHANNEL_ID_PATTERN = /^UC[A-Za-z0-9_-]{22}$/;
const THUMBNAIL_PREFERENCE = ['high', 'medium', 'standard', 'maxres', 'default'];
const KNOWN_PROFILES = ['aimb', 'iamb'];

const projectRoot = new URL('../', import.meta.url);
const channelsPath = new URL('src/data/media-channels.json', projectRoot);
const defaultOutputDir = new URL('src/data/generated/media/', projectRoot);
const coverRoot = new URL('public/media/', projectRoot);

/**
 * @typedef {{ ok: boolean; status: number; json: () => Promise<unknown> }} JsonResponse
 * @param {string} apiKey
 * @param {(url: URL) => Promise<JsonResponse>} [fetchImpl]
 */
export function createRequest(apiKey, fetchImpl = fetch) {
  return async function request(resource, params) {
    const url = new URL(`${API_ROOT}/${resource}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
    url.searchParams.set('key', apiKey);

    let response;
    try {
      response = await fetchImpl(url);
    } catch {
      throw new Error(`youtube ${resource}: network request failed`);
    }
    if (!response.ok) {
      throw new Error(`youtube ${resource}: request rejected with HTTP ${response.status}`);
    }
    try {
      return await response.json();
    } catch {
      throw new Error(`youtube ${resource}: response was not valid JSON`);
    }
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hasExactKeys(value, keys) {
  const actual = Object.keys(value).sort();
  return actual.length === keys.length && actual.every((key, index) => key === keys[index]);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateChannels(channels) {
  assert(isPlainObject(channels), 'channel identity invalid: file is not an object');
  const actual = Object.keys(channels).sort();
  assert(
    actual.length === KNOWN_PROFILES.length && actual.every((id, i) => id === KNOWN_PROFILES[i]),
    `channel identity invalid: expected exactly ${KNOWN_PROFILES.join(', ')}, found ${actual.join(', ') || 'nothing'}`,
  );

  for (const [profileId, channel] of Object.entries(channels)) {
    assert(isPlainObject(channel), `channel identity invalid: ${profileId} is not an object`);
    const unexpected = Object.keys(channel).filter(
      (key) => !['youtube', 'soundcloud', 'instagram', 'tiktok'].includes(key),
    );
    assert(
      unexpected.length === 0,
      `channel identity invalid: ${profileId} has unexpected fields ${unexpected.join(', ')}`,
    );

    const youtube = channel.youtube;
    assert(isPlainObject(youtube), `channel identity invalid: ${profileId} has no youtube identity`);
    assert(
      Object.keys(youtube).every((key) => ['handle', 'channelId'].includes(key)),
      `channel identity invalid: ${profileId} youtube has unexpected fields`,
    );
    assert(
      typeof youtube.handle === 'string' && HANDLE_PATTERN.test(youtube.handle),
      `channel identity invalid: ${profileId} has an invalid handle`,
    );
    assert(
      youtube.channelId === undefined ||
        (typeof youtube.channelId === 'string' && CHANNEL_ID_PATTERN.test(youtube.channelId)),
      `channel identity invalid: ${profileId} has an invalid channel id`,
    );

    for (const social of ['instagram', 'tiktok']) {
      assert(
        channel[social] === undefined || /^[A-Za-z0-9_.]{2,30}$/.test(channel[social]),
        `channel identity invalid: ${profileId} has an invalid ${social} handle`,
      );
    }
    assert(
      channel.soundcloud === undefined ||
        /^https:\/\/soundcloud\.com\/[A-Za-z0-9_-]+\/?$/.test(channel.soundcloud),
      `channel identity invalid: ${profileId} has an invalid soundcloud URL`,
    );
  }
  return channels;
}

async function resolveUploadsPlaylist(channel, request) {
  const selector = channel.channelId ? { id: channel.channelId } : { forHandle: channel.handle };
  const data = await request('channels', { part: 'contentDetails', ...selector });
  const items = Array.isArray(data?.items) ? data.items : [];
  const uploads = items[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (typeof uploads !== 'string' || uploads.length === 0) {
    throw new Error('youtube channels: uploads playlist could not be resolved');
  }
  return uploads;
}

async function fetchCandidates(playlistId, request) {
  const items = [];
  let pageToken;
  do {
    const params = { part: 'snippet,contentDetails', playlistId, maxResults: PAGE_SIZE };
    if (pageToken) params.pageToken = pageToken;
    const data = await request('playlistItems', params);
    const page = Array.isArray(data?.items) ? data.items : [];
    items.push(...page);
    pageToken = typeof data?.nextPageToken === 'string' ? data.nextPageToken : undefined;
  } while (pageToken);

  if (items.length === 0) throw new Error('youtube playlistItems: response contained no items');
  return items;
}

export function parseIsoDuration(value) {
  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value ?? '');
  if (!match || match.slice(1).every((part) => part === undefined)) return null;
  const [days, hours, minutes, seconds] = match.slice(1).map((part) => Number(part ?? 0));
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

async function fetchVideoDetails(videoIds, request) {
  const details = new Map();
  for (let start = 0; start < videoIds.length; start += STATUS_BATCH) {
    const batch = videoIds.slice(start, start + STATUS_BATCH);
    const data = await request('videos', { part: 'status,contentDetails', id: batch.join(',') });
    for (const item of Array.isArray(data?.items) ? data.items : []) {
      if (typeof item?.id !== 'string') continue;
      const status = item.status;
      details.set(item.id, {
        private: status?.privacyStatus === 'private',
        embeddable: status?.embeddable !== false,
        durationSeconds: parseIsoDuration(item.contentDetails?.duration),
      });
    }
  }
  return details;
}

function pickThumbnail(thumbnails) {
  if (!thumbnails || typeof thumbnails !== 'object') return null;
  for (const size of THUMBNAIL_PREFERENCE) {
    const candidate = thumbnails[size];
    if (
      typeof candidate?.url === 'string' &&
      Number.isInteger(candidate.width) &&
      Number.isInteger(candidate.height)
    ) {
      return { url: candidate.url, width: candidate.width, height: candidate.height };
    }
  }
  return null;
}

function toIsoTimestamp(value) {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function normalizeCandidates(items) {
  const normalized = [];
  for (const item of items) {
    const snippet = item?.snippet;
    const videoId = item?.contentDetails?.videoId ?? snippet?.resourceId?.videoId;
    const publishedAt = toIsoTimestamp(
      item?.contentDetails?.videoPublishedAt ?? snippet?.publishedAt,
    );
    const thumbnail = pickThumbnail(snippet?.thumbnails);
    const title = snippet?.title;

    if (typeof videoId !== 'string' || !VIDEO_ID_PATTERN.test(videoId)) continue;
    if (typeof title !== 'string' || title.trim().length === 0) continue;
    if (publishedAt === null || thumbnail === null) continue;

    normalized.push({ videoId, title, publishedAt, thumbnail });
  }
  return normalized;
}

export function selectLatestVideos(items, limit = HOME_COUNT) {
  return items
    .filter((item) => item.source === 'youtube' && item.playback === 'youtube-embed')
    .slice(0, limit);
}

const SOURCES = ['youtube', 'soundcloud', 'instagram', 'tiktok'];
const ITEM_KEYS = [
  'discoveredAt',
  'durationSeconds',
  'id',
  'playback',
  'publishedAt',
  'source',
  'thumbnail',
  'title',
  'url',
];

const canonical = (item) => JSON.stringify(Object.keys(item).sort().map((key) => [key, item[key]]));

export function sameItems(before, after) {
  return before.length === after.length && before.every((item, at) => canonical(item) === canonical(after[at]));
}

export function validateMedia(feed, profileId) {
  const invalid = (message) => assert(false, `generated media invalid: ${message}`);
  if (!isPlainObject(feed)) invalid('feed is not an object');
  if (!hasExactKeys(feed, ['generatedAt', 'items', 'profile', 'refreshedAt'])) {
    invalid('feed has unexpected keys');
  }
  if (feed.profile !== profileId) invalid(`feed belongs to ${feed.profile}, expected ${profileId}`);
  if (toIsoTimestamp(feed.generatedAt) !== feed.generatedAt) invalid('generatedAt is not ISO');
  if (!isPlainObject(feed.refreshedAt)) invalid('refreshedAt is missing');
  for (const [source, stamp] of Object.entries(feed.refreshedAt)) {
    if (!SOURCES.includes(source)) invalid(`unknown refreshed source: ${source}`);
    if (toIsoTimestamp(stamp) !== stamp) invalid(`refreshedAt.${source} is not ISO`);
  }
  if (!Array.isArray(feed.items) || feed.items.length === 0) invalid('items is empty');

  const seen = new Set();
  let previous = Number.POSITIVE_INFINITY;
  for (const item of feed.items) {
    if (!isPlainObject(item)) invalid('item is not an object');
    const keys = Object.keys(item)
      .filter((key) => key !== 'videoId')
      .sort();
    if (keys.length !== ITEM_KEYS.length || keys.some((key, i) => key !== ITEM_KEYS[i])) {
      invalid(`item ${item.id} has unexpected keys`);
    }
    if (!SOURCES.includes(item.source)) invalid(`unknown source: ${item.source}`);
    if (!String(item.id).startsWith(`${item.source}:`)) invalid(`id is not source-scoped: ${item.id}`);
    if (seen.has(item.id)) invalid(`duplicate id: ${item.id}`);
    seen.add(item.id);
    if (typeof item.title !== 'string' || item.title.trim().length === 0) invalid('title is empty');
    if (!/^https:\/\//.test(item.url)) invalid(`url is not https: ${item.id}`);
    if (toIsoTimestamp(item.publishedAt) !== item.publishedAt) invalid(`publishedAt: ${item.id}`);
    if (toIsoTimestamp(item.discoveredAt) !== item.discoveredAt) invalid(`discoveredAt: ${item.id}`);
    if (
      item.durationSeconds !== null &&
      !(Number.isFinite(item.durationSeconds) && item.durationSeconds >= 0)
    ) {
      invalid(`durationSeconds: ${item.id}`);
    }
    if (item.source === 'youtube') {
      if (!VIDEO_ID_PATTERN.test(item.videoId ?? '')) invalid(`videoId: ${item.id}`);
      if (!['youtube-embed', 'external'].includes(item.playback)) invalid(`playback: ${item.id}`);
    } else if (item.source === 'soundcloud') {
      if ('videoId' in item) invalid(`${item.id} must not carry a videoId`);
      if (!['soundcloud-widget', 'external'].includes(item.playback)) {
        invalid(`playback: ${item.id}`);
      }
    } else {
      if ('videoId' in item) invalid(`${item.id} must not carry a videoId`);
      if (item.playback !== 'external') invalid(`playback: ${item.id}`);
    }
    if (item.thumbnail !== null) {
      if (!isPlainObject(item.thumbnail)) invalid(`thumbnail: ${item.id}`);
      if (!hasExactKeys(item.thumbnail, ['height', 'url', 'width'])) {
        invalid(`thumbnail keys: ${item.id}`);
      }
      if (!/^(https:\/\/|\/media\/)/.test(item.thumbnail.url)) {
        invalid(`thumbnail url: ${item.id}`);
      }
    }

    const published = Date.parse(item.publishedAt);
    if (published > previous) invalid('items are not newest first');
    previous = published;
  }
  return feed;
}

export function mergeSource(previousItems, incoming, source, now, additive = false) {
  if (incoming.length === 0) return previousItems;

  const others = previousItems.filter((item) => item.source !== source);
  const existing = previousItems.filter((item) => item.source === source);
  const byId = new Map(existing.map((item) => [item.id, item]));

  const merged = incoming.map((item) => {
    const before = byId.get(item.id);
    return {
      ...item,
      thumbnail: item.thumbnail ?? before?.thumbnail ?? null,
      discoveredAt: before?.discoveredAt ?? now,
    };
  });

  if (additive) {
    const seen = new Set(merged.map((item) => item.id));
    merged.push(...existing.filter((item) => !seen.has(item.id)));
  }

  return [...others, ...merged].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export async function buildYouTubeItems(channel, request) {
  const playlistId = await resolveUploadsPlaylist(channel, request);
  const candidates = normalizeCandidates(await fetchCandidates(playlistId, request));
  if (candidates.length === 0) throw new Error('youtube playlistItems: no usable video records');

  const details = await fetchVideoDetails(
    candidates.map((video) => video.videoId),
    request,
  );

  const items = [];
  for (const video of candidates) {
    const detail = details.get(video.videoId);
    if (detail?.private) continue;
    items.push({
      id: `youtube:${video.videoId}`,
      source: 'youtube',
      url: `https://www.youtube.com/watch?v=${video.videoId}`,
      title: video.title,
      publishedAt: video.publishedAt,
      discoveredAt: video.publishedAt,
      durationSeconds: detail?.durationSeconds ?? null,
      thumbnail: video.thumbnail,
      videoId: video.videoId,
      playback: detail?.embeddable === false ? 'external' : 'youtube-embed',
    });
  }
  if (items.length === 0) throw new Error('youtube videos: every candidate is private');
  return items.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export async function readChannels(source = channelsPath) {
  return validateChannels(JSON.parse(await readFile(source, 'utf8')));
}

export async function readMedia(profileId, outputDir = defaultOutputDir) {
  const file = path.join(fileURLToPath(outputDir), `${profileId}.json`);
  return JSON.parse(await readFile(file, 'utf8'));
}

async function fileExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

/** @type {(from: string, to: string) => Promise<void>} */
const renameTarget = rename;

async function replaceAtomically(directory, feeds, renameFile) {
  const staged = [];
  try {
    for (const [profileId, feed] of feeds) {
      const target = path.join(directory, `${profileId}.json`);
      const entry = {
        target,
        temporary: `${target}.tmp`,
        backup: `${target}.bak`,
        existed: await fileExists(target),
        replaced: false,
      };
      if (entry.existed) await copyFile(target, entry.backup);
      await writeFile(entry.temporary, `${JSON.stringify(feed, null, 2)}\n`, 'utf8');
      staged.push(entry);
    }
    for (const entry of staged) {
      await renameFile(entry.temporary, entry.target);
      entry.replaced = true;
    }
  } catch (error) {
    for (const entry of staged) {
      if (!entry.replaced) continue;
      if (entry.existed) await copyFile(entry.backup, entry.target);
      else await rm(entry.target, { force: true });
    }
    throw error;
  } finally {
    await Promise.all(
      staged.flatMap(({ temporary, backup }) => [
        rm(temporary, { force: true }),
        rm(backup, { force: true }),
      ]),
    );
  }
}

export async function refreshAll({
  channels,
  request,
  outputDir = defaultOutputDir,
  now = new Date().toISOString(),
  renameFile = renameTarget,
}) {
  validateChannels(channels);

  const feeds = new Map();
  const pending = new Map();
  for (const [profileId, channel] of Object.entries(channels)) {
    const previous = await readMedia(profileId, outputDir).catch(() => null);
    const previousItems = previous?.items ?? [];
    const incoming = await buildYouTubeItems(channel.youtube, request);

    const items = mergeSource(previousItems, incoming, 'youtube', now);

    if (previous && sameItems(previousItems, items)) {
      feeds.set(profileId, validateMedia(previous, profileId));
      continue;
    }

    const feed = {
      profile: profileId,
      generatedAt: now,
      refreshedAt: { ...(previous?.refreshedAt ?? {}), youtube: now },
      items,
    };
    feeds.set(profileId, validateMedia(feed, profileId));
    pending.set(profileId, feeds.get(profileId));
  }

  const directory = fileURLToPath(outputDir);
  await mkdir(directory, { recursive: true });
  if (pending.size > 0) await replaceAtomically(directory, pending, renameFile);
  return feeds;
}

export async function validateGeneratedCache(outputDir = defaultOutputDir) {
  const directory = fileURLToPath(outputDir);
  const expected = KNOWN_PROFILES.map((profileId) => `${profileId}.json`);

  let entries;
  try {
    entries = (await readdir(directory)).sort();
  } catch {
    throw new Error('generated cache invalid: the generated media directory does not exist');
  }
  assert(
    entries.length === expected.length && entries.every((name, i) => name === expected[i]),
    `generated cache invalid: expected exactly ${expected.join(', ')}, found ${entries.join(', ') || 'nothing'}`,
  );

  const summaries = [];
  for (const name of expected) {
    const profileId = name.slice(0, -'.json'.length);
    let feed;
    try {
      feed = JSON.parse(await readFile(path.join(directory, name), 'utf8'));
    } catch {
      throw new Error(`generated cache invalid: ${name} is not valid JSON`);
    }
    validateMedia(feed, profileId);

    for (const item of feed.items) {
      const url = item.thumbnail?.url;
      if (typeof url === 'string' && url.startsWith('/media/')) {
        const cover = path.join(fileURLToPath(coverRoot), url.slice('/media/'.length));
        assert(await fileExists(cover), `generated cache invalid: missing cover ${url}`);
      }
    }

    const counts = {};
    for (const item of feed.items) counts[item.source] = (counts[item.source] ?? 0) + 1;
    summaries.push({
      profile: feed.profile,
      items: feed.items.length,
      counts,
      home: selectLatestVideos(feed.items).length,
    });
  }
  return summaries;
}

async function refreshSocialSources(profileId, channel, feed, now, outputDir) {
  const { fetchInstagram, fetchTikTok } = await import('./refresh-social.mjs');
  let items = feed.items;
  const refreshedAt = { ...feed.refreshedAt };

  for (const [source, fetcher, handle] of [
    ['instagram', fetchInstagram, channel.instagram],
    ['tiktok', fetchTikTok, channel.tiktok],
  ]) {
    if (!handle) continue;
    const incoming = await fetcher(handle, now).catch(() => []);
    if (incoming.length === 0) {
      console.warn(`${profileId} ${source}: no usable records, keeping the previous cache`);
      continue;
    }
    const merged = mergeSource(items, incoming, source, now, true);
    if (sameItems(items, merged)) {
      console.log(`${profileId} ${source}: unchanged`);
      continue;
    }
    items = merged;
    refreshedAt[source] = now;
    console.log(`${profileId} ${source}: ${incoming.length} records`);
  }

  if (sameItems(feed.items, items)) return feed;

  const next = validateMedia({ ...feed, generatedAt: now, items, refreshedAt }, profileId);
  await replaceAtomically(fileURLToPath(outputDir), new Map([[profileId, next]]), renameTarget);
  return next;
}

async function refreshSoundCloudSource(profileId, profileUrl, feed, request, now, outputDir) {
  const { fetchSoundCloud } = await import('./refresh-soundcloud.mjs');
  const incoming = await fetchSoundCloud(profileUrl, request).catch(() => []);
  if (incoming.length === 0) {
    console.warn(`${profileId} soundcloud: no usable records, keeping the previous cache`);
    return feed;
  }

  const items = mergeSource(feed.items, incoming, 'soundcloud', now);
  if (sameItems(feed.items, items)) {
    console.log(`${profileId} soundcloud: unchanged`);
    return feed;
  }

  const next = validateMedia(
    {
      ...feed,
      generatedAt: now,
      items,
      refreshedAt: { ...feed.refreshedAt, soundcloud: now },
    },
    profileId,
  );
  await replaceAtomically(fileURLToPath(outputDir), new Map([[profileId, next]]), renameTarget);
  console.log(`${profileId} soundcloud: ${incoming.length} records`);
  return next;
}

async function main(argv) {
  if (argv.includes('--validate-cache')) {
    for (const summary of await validateGeneratedCache()) {
      const detail = Object.entries(summary.counts)
        .map(([source, count]) => `${source}=${count}`)
        .join(' ');
      console.log(`${summary.profile}: ${summary.items} items (${detail}), home uses ${summary.home}`);
    }
    return;
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new Error('YOUTUBE_API_KEY is not set; generated media was left unchanged');
  }

  const channels = await readChannels();
  const now = new Date().toISOString();
  const feeds = await refreshAll({ channels, request: createRequest(apiKey.trim()), now });

  if (argv.includes('--with-social')) {
    for (const [profileId, channel] of Object.entries(channels)) {
      const feed = feeds.get(profileId);
      if (feed) feeds.set(profileId, await refreshSocialSources(profileId, channel, feed, now, defaultOutputDir));
    }
  }

  if (argv.includes('--with-soundcloud')) {
    const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
    const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;
    if (clientId && clientSecret) {
      const { createSoundCloudRequest } = await import('./refresh-soundcloud.mjs');
      const request = await createSoundCloudRequest(clientId, clientSecret);
      for (const [profileId, channel] of Object.entries(channels)) {
        const feed = feeds.get(profileId);
        if (feed && channel.soundcloud) {
          feeds.set(
            profileId,
            await refreshSoundCloudSource(
              profileId,
              channel.soundcloud,
              feed,
              request,
              now,
              defaultOutputDir,
            ),
          );
        }
      }
    } else {
      console.warn('soundcloud: credentials are not set, keeping the previous cache');
    }
  }

  for (const [profileId, feed] of feeds) {
    const counts = {};
    for (const item of feed.items) counts[item.source] = (counts[item.source] ?? 0) + 1;
    console.log(`${profileId}: ${feed.items.length} items`, counts);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`refresh-media failed: ${error.message}`);
    process.exitCode = 1;
  });
}

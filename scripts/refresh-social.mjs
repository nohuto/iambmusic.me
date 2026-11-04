import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const run = promisify(execFile);
const coverRoot = fileURLToPath(new URL('../public/media/', import.meta.url));
const COVER_WIDTH = 160;
const COVER_HEIGHT = 90;
const COVER_QUALITY = 78;

function optimizeCover(bytes) {
  return sharp(bytes)
    .resize({ width: COVER_WIDTH, height: COVER_HEIGHT })
    .jpeg({ quality: COVER_QUALITY, mozjpeg: true })
    .toBuffer();
}

async function saveCover(source, id, url) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bytes = await optimizeCover(
      Buffer.from(await response.arrayBuffer()),
    );
    await mkdir(path.join(coverRoot, source), { recursive: true });
    await writeFile(path.join(coverRoot, source, `${id}.jpg`), bytes);
    return {
      url: `/media/${source}/${id}.jpg`,
      width: COVER_WIDTH,
      height: COVER_HEIGHT,
    };
  } catch (error) {
    console.warn(`${source} cover ${id}: ${error.message}`);
    return null;
  }
}

export async function fetchTikTok(handle, now) {
  if (!handle) return [];
  let stdout;
  try {
    ({ stdout } = await run(
      'yt-dlp',
      [
        '--dump-json',
        '--flat-playlist',
        '--playlist-end',
        '60',
        `https://www.tiktok.com/@${handle}`,
      ],
      { maxBuffer: 32 * 1024 * 1024 },
    ));
  } catch (error) {
    throw new Error(`tiktok @${handle}: yt-dlp failed`, { cause: error });
  }

  const items = [];
  for (const line of stdout.split('\n').filter(Boolean)) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    const id = String(entry.id ?? '');
    if (!/^\d+$/.test(id) || !Number.isFinite(entry.timestamp)) continue;
    items.push({
      id: `tiktok:${id}`,
      source: 'tiktok',
      url: `https://www.tiktok.com/@${handle}/video/${id}`,
      title: (entry.title || entry.description || `TikTok ${id}`).slice(0, 200),
      publishedAt: new Date(entry.timestamp * 1000).toISOString(),
      discoveredAt: now,
      durationSeconds: Number.isFinite(entry.duration)
        ? Math.round(entry.duration)
        : null,
      thumbnail: await saveCover('tiktok', id, entry.thumbnail),
      playback: 'external',
    });
  }
  return items;
}

export async function fetchInstagram(handle, now) {
  if (!handle) return [];
  let payload;
  try {
    const response = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${handle}`,
      {
        headers: {
          'x-ig-app-id': '936619743392459',
          'user-agent': 'Mozilla/5.0',
        },
      },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    payload = await response.json();
  } catch (error) {
    throw new Error(`instagram @${handle}: profile request failed`, {
      cause: error,
    });
  }

  const edges = payload?.data?.user?.edge_owner_to_timeline_media?.edges ?? [];
  const items = [];
  for (const { node } of edges) {
    const code = node?.shortcode;
    if (
      typeof code !== 'string' ||
      code.length === 0 ||
      !Number.isFinite(node.taken_at_timestamp)
    )
      continue;
    const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text ?? '';
    items.push({
      id: `instagram:${code}`,
      source: 'instagram',
      url: `https://www.instagram.com/p/${code}/`,
      title: (caption.split('\n')[0] || `Instagram ${code}`).slice(0, 200),
      publishedAt: new Date(node.taken_at_timestamp * 1000).toISOString(),
      discoveredAt: now,
      durationSeconds: Number.isFinite(node.video_duration)
        ? Math.round(node.video_duration)
        : null,
      thumbnail: await saveCover('instagram', code, node.display_url),
      playback: 'external',
    });
  }
  return items;
}

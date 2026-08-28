import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const legacy = process.argv[2] ?? 'C:/Users/nohuto/Desktop/iambmusic.github.io';
const root = fileURLToPath(new URL('../', import.meta.url));
const mediaDir = path.join(root, 'src/data/generated/media');
const coverDir = path.join(root, 'public/media');

const shortcode = (url) => url.match(/\/p\/([^/]+)/)?.[1] ?? null;
const tiktokId = (url) => url.match(/\/video\/(\d+)/)?.[1] ?? null;
const videoId = (url) => url.match(/[?&]v=([A-Za-z0-9_-]{11})/)?.[1] ?? null;

function jpegSize(buffer) {
  let i = 2;
  while (i < buffer.length) {
    if (buffer[i] !== 0xff) { i += 1; continue; }
    const marker = buffer[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buffer.readUInt16BE(i + 5), width: buffer.readUInt16BE(i + 7) };
    }
    if (marker === 0xd8 || marker === 0xd9) { i += 2; continue; }
    i += 2 + buffer.readUInt16BE(i + 2);
  }
  return { width: null, height: null };
}

async function cover(source, id, sourceDir) {
  const from = path.join(legacy, sourceDir, `${id}.jpg`);
  try {
    const bytes = await readFile(from);
    await mkdir(path.join(coverDir, source), { recursive: true });
    await copyFile(from, path.join(coverDir, source, `${id}.jpg`));
    return { url: `/media/${source}/${id}.jpg`, ...jpegSize(bytes) };
  } catch {
    return null;
  }
}

async function seed(profile) {
  const feed = JSON.parse(await readFile(path.join(legacy, `assets/social-feed-${profile}.json`), 'utf8'));
  const discoveredAt = new Date(feed.generated_at).toISOString();
  const items = [];

  for (const record of feed.youtube ?? []) {
    const id = videoId(record.url ?? '');
    if (!id) continue;
    items.push({
      id: `youtube:${id}`,
      source: 'youtube',
      url: `https://www.youtube.com/watch?v=${id}`,
      title: record.title,
      publishedAt: new Date(record.published).toISOString(),
      discoveredAt,
      durationSeconds: null,
      thumbnail: { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, width: 480, height: 360 },
      videoId: id,
      playback: 'youtube-embed',
    });
  }

  for (const [source, extract, dir] of [
    ['instagram', shortcode, 'assets/ig-covers'],
    ['tiktok', tiktokId, 'assets/tiktok-covers'],
  ]) {
    for (const record of feed[source] ?? []) {
      const id = extract(record.url ?? '');
      if (!id) continue;
      items.push({
        id: `${source}:${id}`,
        source,
        url: record.url,
        title: record.title,
        publishedAt: new Date(record.published).toISOString(),
        discoveredAt,
        durationSeconds: null,
        thumbnail: await cover(source, id, dir),
        playback: 'external',
      });
    }
  }

  items.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  const sources = [...new Set(items.map((item) => item.source))];
  const feedFile = {
    profile,
    generatedAt: new Date().toISOString(),
    refreshedAt: Object.fromEntries(sources.map((source) => [source, discoveredAt])),
    items,
  };

  await mkdir(mediaDir, { recursive: true });
  await writeFile(path.join(mediaDir, `${profile}.json`), `${JSON.stringify(feedFile, null, 2)}\n`, 'utf8');
  const counts = Object.fromEntries(sources.map((s) => [s, items.filter((i) => i.source === s).length]));
  console.log(`${profile}: ${items.length} items`, counts);
}

await seed('iamb');
await seed('aimp');
const covers = await Promise.all(
  ['instagram', 'tiktok'].map(async (s) => {
    try { return `${s}=${(await readdir(path.join(coverDir, s))).length}`; } catch { return `${s}=0`; }
  }),
);
console.log('covers copied:', covers.join(' '));

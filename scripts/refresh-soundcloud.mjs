const API_ROOT = 'https://api.soundcloud.com/';
const TOKEN_URL = 'https://secure.soundcloud.com/oauth/token';

async function readJson(response, label) {
  if (!response.ok) throw new Error(`${label}: request rejected with HTTP ${response.status}`);
  try {
    return await response.json();
  } catch {
    throw new Error(`${label}: response was not valid JSON`);
  }
}

export async function createSoundCloudRequest(clientId, clientSecret, fetchImpl = fetch) {
  let response;
  try {
    response = await fetchImpl(TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json; charset=utf-8',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
  } catch {
    throw new Error('soundcloud auth: network request failed');
  }

  const token = await readJson(response, 'soundcloud auth');
  if (typeof token?.access_token !== 'string' || token.access_token.length === 0) {
    throw new Error('soundcloud auth: access token was missing');
  }

  return async function request(resource) {
    const url = new URL(resource, API_ROOT);
    let result;
    try {
      result = await fetchImpl(url, {
        headers: {
          Accept: 'application/json; charset=utf-8',
          Authorization: `OAuth ${token.access_token}`,
        },
      });
    } catch {
      throw new Error(`soundcloud ${url.pathname}: network request failed`);
    }
    return readJson(result, `soundcloud ${url.pathname}`);
  };
}

function timestamp(value) {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function normalizeSoundCloudTracks(tracks) {
  const items = [];
  for (const track of tracks) {
    const match = /^soundcloud:tracks:(.+)$/.exec(track?.urn ?? '');
    const publishedAt = timestamp(track?.created_at);
    const artwork = track?.artwork_url ?? track?.user?.avatar_url;
    if (!match || typeof track?.title !== 'string' || track.title.trim().length === 0) continue;
    if (typeof track?.permalink_url !== 'string' || publishedAt === null) continue;

    const playable =
      track.access === 'playable' && track.streamable !== false && track.embeddable_by === 'all';
    items.push({
      id: `soundcloud:${match[1]}`,
      source: 'soundcloud',
      url: track.permalink_url,
      title: track.title,
      publishedAt,
      discoveredAt: publishedAt,
      durationSeconds: Number.isFinite(track.duration) ? Math.round(track.duration / 1000) : null,
      thumbnail:
        typeof artwork === 'string' && artwork.startsWith('https://')
          ? { url: artwork, width: null, height: null }
          : null,
      playback: playable ? 'soundcloud-widget' : 'external',
    });
  }
  return items.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export async function fetchSoundCloud(profileUrl, request) {
  const profile = await request(`/resolve?url=${encodeURIComponent(profileUrl)}`);
  if (!/^soundcloud:users:.+$/.test(profile?.urn ?? '')) {
    throw new Error('soundcloud resolve: profile could not be resolved');
  }

  const tracks = [];
  let next = `/users/${encodeURIComponent(profile.urn)}/tracks?access=playable&limit=200&linked_partitioning=true`;
  while (next) {
    const page = await request(next);
    const collection = Array.isArray(page?.collection) ? page.collection : Array.isArray(page) ? page : [];
    tracks.push(...collection);
    next = typeof page?.next_href === 'string' ? page.next_href : '';
  }
  return normalizeSoundCloudTracks(tracks);
}

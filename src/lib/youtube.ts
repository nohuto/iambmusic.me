const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

function assertVideoId(videoId: string): string {
  if (!VIDEO_ID_PATTERN.test(videoId)) throw new Error(`invalid youtube video id: ${videoId}`);
  return videoId;
}

export function watchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${assertVideoId(videoId)}`;
}

export function embedUrl(videoId: string, origin?: string): string {
  const url = new URL(`https://www.youtube-nocookie.com/embed/${assertVideoId(videoId)}`);
  url.searchParams.set('autoplay', '1');
  url.searchParams.set('playsinline', '1');
  url.searchParams.set('rel', '0');
  url.searchParams.set('enablejsapi', '1');
  if (origin) url.searchParams.set('origin', origin);
  return url.href;
}

import type { ProfileId } from '../data/types.ts';

const brandAliases: Record<ProfileId, readonly string[]> = {
  iamb: ['iamb Synthmusic'],
  aimb: ['AiMB Project'],
};

const leadingSeparator = /^[\s\-–\u2014:|]+/;

export function displayTitle(profile: ProfileId, raw: string): string {
  const title = raw.trim();
  const alias = [...brandAliases[profile]]
    .sort((a, b) => b.length - a.length)
    .find((entry) => title.toLowerCase().startsWith(entry.toLowerCase()));
  if (!alias) return title;

  const rest = title.slice(alias.length);
  if (!leadingSeparator.test(rest)) return title;

  const cleaned = rest.replace(leadingSeparator, '').trim();
  return cleaned.length > 0 ? cleaned : title;
}

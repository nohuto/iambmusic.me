import type { Language, PageId, ProfileId } from '../data/types.ts';
import { languages, profileIds } from '../data/types.ts';

export interface RouteTarget {
  readonly lang: Language;
  readonly profile: ProfileId;
}

export const defaultLanguage: Language = 'de';

export function routePath(lang: Language, profile: ProfileId, page: PageId): string {
  return page === 'home' ? `/${lang}/${profile}/` : `/${lang}/${profile}/${page}/`;
}

export const routeTargets: readonly RouteTarget[] = languages.flatMap((lang) =>
  profileIds.map((profile) => ({ lang, profile })),
);

export function profileStaticPaths() {
  return routeTargets.map(({ lang, profile }) => ({
    params: { lang, profile },
    props: { lang, profile },
  }));
}

export function otherLanguage(lang: Language): Language {
  return lang === 'de' ? 'en' : 'de';
}

export function otherProfile(profile: ProfileId): ProfileId {
  return profile === 'iamb' ? 'aimp' : 'iamb';
}

export function alternateLinks(profile: ProfileId, page: PageId) {
  return [
    ...languages.map((lang) => ({ hreflang: lang, path: routePath(lang, profile, page) })),
    { hreflang: 'x-default', path: routePath(defaultLanguage, profile, page) },
  ];
}

export function absoluteUrl(path: string, site: URL | undefined): string {
  return site ? new URL(path, site).href : path;
}

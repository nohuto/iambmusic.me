import type { Language, LocalizedText, UiDictionary } from '../data/types.ts';
import { de } from './de.ts';
import { en } from './en.ts';

export const dictionaries: Readonly<Record<Language, UiDictionary>> = { de, en };

export const defaultLanguage: Language = 'de';

export function getDictionary(language: Language): UiDictionary {
  return dictionaries[language];
}

export function localize(text: LocalizedText, language: Language): string {
  return text[language];
}

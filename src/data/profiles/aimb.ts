import logo from '../../assets/profiles/aimb/logo.png';
import channels from '../media-channels.json';
import type { AimbProfile } from '../types.ts';

export const aimbProfile: AimbProfile = {
  id: 'aimb',
  name: 'AIMB Music Project',
  shortName: 'AIMB',
  meta: {
    home: {
      de: 'Cinematische elektronische Musik, produziert in Zusammenarbeit mit KI.',
      en: 'Cinematic electronic music, produced in collaboration with AI.',
    },
    music: {
      de: 'Hier findest du meine neuesten Uploads von AIMB auf YouTube und SoundCloud.',
      en: 'Find my latest AIMB uploads on YouTube and SoundCloud here.',
    },
    social: {
      de: 'Meine Kanäle auf Social Media für das AIMB Music Project.',
      en: 'My social media channels for the AIMB Music Project.',
    },
    contact: {
      de: 'So erreichst du mich für das AIMB Music Project.',
      en: 'Get in touch with me about the AIMB Music Project.',
    },
    about: {
      de: 'Ich bin Markus B., hier erzähle ich von meinem Werdegang, meinem Studio und meinen Inspirationen.',
      en: 'I’m Markus B., here I share my story, studio setup and inspirations.',
    },
  },
  hero: {
    title: { de: 'Music created in collab with AI', en: 'Music created in collab with AI' },
    lead: {
      de: 'Cinematische elektronische Musik, produziert in Zusammenarbeit mit KI.',
      en: 'Cinematic electronic music, produced in collaboration with AI.',
    },
  },
  images: {
    logo,
    logoAlt: { de: 'Logo des AIMB Music Project', en: 'AIMB Music Project logo' },
  },
  tracks: [
    {
      profile: 'aimb',
      id: 'last-in-space',
      title: 'Last in Space',
      durationSeconds: 48,
      sources: [{ format: 'wav', src: '/audio/aimb/last-in-space.wav', mimeType: 'audio/wav' }],
    },
  ],
  platforms: [
    {
      profile: 'aimb',
      id: 'youtube',
      name: 'YouTube',
      url: 'https://www.youtube.com/@AiMP-Musicproject',
      category: 'social',
    },
    {
      profile: 'aimb',
      id: 'soundcloud',
      name: 'SoundCloud',
      url: 'https://soundcloud.com/aimp-musicproject',
      category: 'listening',
    },
  ],
  youtube: { profile: 'aimb', ...channels.aimb.youtube },
  contact: { email: 'iamb.synthmusic@gmail.com' },
};

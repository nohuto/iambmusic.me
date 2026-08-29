import logo from '../../assets/profiles/aimp/logo.png';
import channels from '../media-channels.json';
import type { AimpProfile } from '../types.ts';

export const aimpProfile: AimpProfile = {
  id: 'aimp',
  name: 'AiMP Music Project',
  shortName: 'AiMP',
  meta: {
    home: {
      de: 'Cinematische elektronische Musik, produziert in Zusammenarbeit mit KI.',
      en: 'Cinematic electronic music, produced in collaboration with AI.',
    },
    music: {
      de: 'Hier findest du meine neuesten Uploads von AiMP.',
      en: 'Find my latest AiMP uploads here.',
    },
    social: {
      de: 'Meine Kanäle auf Social Media für das AiMP Music Project.',
      en: 'My social media channels for the AiMP Music Project.',
    },
    contact: {
      de: 'So erreichst du mich für das AiMP Music Project.',
      en: 'Get in touch with me about the AiMP Music Project.',
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
    logoAlt: { de: 'Logo des AiMP Music Project', en: 'AiMP Music Project logo' },
  },
  tracks: [
    {
      profile: 'aimp',
      id: 'last-in-space',
      title: 'Last in Space',
      sources: [{ format: 'wav', src: '/audio/aimp/last-in-space.wav', mimeType: 'audio/wav' }],
    },
  ],
  platforms: [
    {
      profile: 'aimp',
      id: 'youtube',
      name: 'YouTube',
      url: 'https://www.youtube.com/@AiMP-Musicproject',
      category: 'social',
    },
    {
      profile: 'aimp',
      id: 'soundcloud',
      name: 'SoundCloud',
      url: 'https://soundcloud.com/aimp-musicproject',
      category: 'listening',
    },
  ],
  youtube: { profile: 'aimp', ...channels.aimp.youtube },
  contact: { email: 'iamb.synthmusic@gmail.com' },
};

import logo from '../../assets/profiles/aimb/logo.png';
import type { AimbProfile } from '../types.ts';

export const aimbProfile: AimbProfile = {
  id: 'aimb',
  name: 'AiMB Project',
  shortName: 'AiMB',
  meta: {
    home: {
      de: 'Cinematische elektronische Musik, produziert in Zusammenarbeit mit KI.',
      en: 'Cinematic electronic music, produced in collaboration with AI.',
    },
    music: {
      de: 'Hier findest du meine neuesten Uploads von AiMB auf YouTube und SoundCloud.',
      en: 'Find my latest AiMB uploads on YouTube and SoundCloud here.',
    },
    social: {
      de: 'Meine Kanäle auf Social Media für das AiMB Project.',
      en: 'My social media channels for the AiMB Project.',
    },
    contact: {
      de: 'So erreichst du mich für das AiMB Project.',
      en: 'Get in touch with me about the AiMB Project.',
    },
    about: {
      de: 'Ich bin Markus B. Hier erzähle ich von meinem Werdegang, meinem Studio und meinen Inspirationen.',
      en: 'I’m Markus B. Here I share my story, studio setup and inspirations.',
    },
  },
  hero: {
    lead: {
      de: 'Cinematische elektronische Musik, produziert in Zusammenarbeit mit KI.',
      en: 'Cinematic electronic music, produced in collaboration with AI.',
    },
  },
  images: {
    logo,
  },
  tracks: [
    {
      profile: 'aimb',
      id: 'last-in-space',
      title: 'Last in Space',
      durationSeconds: 48,
      sources: [
        {
          src: '/audio/aimb/last-in-space.mp3',
          mimeType: 'audio/mpeg',
        },
      ],
    },
  ],
  platforms: [
    {
      profile: 'aimb',
      id: 'youtube',
      name: 'YouTube',
      url: 'https://www.youtube.com/@AiMB-Project',
      category: 'social',
    },
    {
      profile: 'aimb',
      id: 'soundcloud',
      name: 'SoundCloud',
      url: 'https://soundcloud.com/aimb-project',
      category: 'listening',
    },
  ],
};

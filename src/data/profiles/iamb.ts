import logo from '../../assets/profiles/iamb/logo.png';
import type { IambProfile } from '../types.ts';

export const iambProfile: IambProfile = {
  id: 'iamb',
  name: 'IAMB Synthmusic',
  shortName: 'IAMB',
  meta: {
    home: {
      de: 'Meine Welt aus cinematischem Synthwave und atmosphärischen Produktionen. Jetzt reinhören.',
      en: 'My world of cinematic synthwave and atmospheric productions. Start listening now.',
    },
    music: {
      de: 'Hier findest du meine neuesten Uploads auf YouTube und SoundCloud für IAMB Synthmusic.',
      en: 'Find my latest IAMB Synthmusic uploads on YouTube and SoundCloud here.',
    },
    social: {
      de: 'Meine Beiträge für IAMB Synthmusic auf TikTok und Instagram.',
      en: 'My IAMB Synthmusic posts on TikTok and Instagram.',
    },
    contact: {
      de: 'So erreichst du mich bei IAMB Synthmusic.',
      en: 'Get in touch with me about IAMB Synthmusic.',
    },
    about: {
      de: 'Ich bin Markus B. Hier erzähle ich von meinem Werdegang, meinem Studio und meinen Inspirationen.',
      en: 'I’m Markus B. Here I share my story, studio setup and inspirations.',
    },
  },
  hero: {
    lead: {
      de: 'Elektronische Soundtracks, gespielt auf meinem Masterkeyboard und produziert mit Cakewalk Sonar.',
      en: 'Electronic soundtracks, played on my master keyboard and produced with Cakewalk Sonar.',
    },
  },
  images: {
    logo,
  },
  tracks: [
    {
      profile: 'iamb',
      id: 'welcome-1',
      title: 'Welcome 1',
      durationSeconds: 59,
      sources: [
        {
          src: '/audio/iamb/welcome-1.mp3',
          mimeType: 'audio/mpeg',
        },
      ],
    },
    {
      profile: 'iamb',
      id: 'welcome-2',
      title: 'Welcome 2',
      durationSeconds: 49,
      sources: [
        {
          src: '/audio/iamb/welcome-2.mp3',
          mimeType: 'audio/mpeg',
        },
      ],
    },
  ],
  platforms: [
    {
      profile: 'iamb',
      id: 'youtube',
      name: 'YouTube',
      url: 'https://www.youtube.com/@iamb-synthmusic7820',
      category: 'social',
    },
    {
      profile: 'iamb',
      id: 'tiktok',
      name: 'TikTok',
      url: 'https://www.tiktok.com/@iamb.synthmusic',
      category: 'social',
    },
    {
      profile: 'iamb',
      id: 'instagram',
      name: 'Instagram',
      url: 'https://www.instagram.com/iamb.synthmusic/',
      category: 'social',
    },
    {
      profile: 'iamb',
      id: 'bandlab',
      name: 'BandLab',
      url: 'https://www.bandlab.com/iamb_synthmusic',
      category: 'social',
    },
    {
      profile: 'iamb',
      id: 'spotify',
      name: 'Spotify',
      url: 'https://open.spotify.com/artist/31f8iEkHYOs73gZurN4waJ',
      category: 'listening',
    },
    {
      profile: 'iamb',
      id: 'applemusic',
      name: 'Apple Music',
      url: 'https://music.apple.com/us/artist/iamb-synthmusic/1632680655',
      category: 'listening',
    },
    {
      profile: 'iamb',
      id: 'amazonmusic',
      name: 'Amazon Music',
      url: 'https://www.amazon.com/music/player/artists/B0B5PN5NCJ/iamb-synthmusic',
      category: 'listening',
    },
    {
      profile: 'iamb',
      id: 'soundcloud',
      name: 'SoundCloud',
      url: 'https://soundcloud.com/iamb-synthmusic',
      category: 'listening',
    },
    {
      profile: 'iamb',
      id: 'beatport',
      name: 'Beatport',
      url: 'https://www.beatport.com/release/memories-its-your-life/5069423',
      category: 'listening',
    },
    {
      profile: 'iamb',
      id: 'traxsource',
      name: 'Traxsource',
      url: 'https://www.traxsource.com/artist/675015/',
      category: 'listening',
    },
    {
      profile: 'iamb',
      id: 'qobuz',
      name: 'Qobuz',
      url: 'https://www.qobuz.com/us-en/interpreter/iamb-synthmusic/14736427',
      category: 'listening',
    },
    {
      profile: 'iamb',
      id: 'bandcamp',
      name: 'Bandcamp',
      url: 'https://iamb-synthmusic.bandcamp.com/',
      category: 'listening',
    },
  ],
};

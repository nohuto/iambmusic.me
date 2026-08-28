import logo from '../../assets/profiles/aimp/logo.jpg';
import portrait from '../../assets/profiles/aimp/portrait.jpg';
import channels from '../media-channels.json';
import type { AimpProfile } from '../types.ts';

export const aimpProfile: AimpProfile = {
  id: 'aimp',
  name: 'AiMP Music Project',
  shortName: 'AiMP',
  accent: 'blue',
  meta: {
    home: {
      de: 'AiMP – cinematische elektronische Musikprojekte in Zusammenarbeit mit KI.',
      en: 'AiMP – cinematic electronic music projects created in collaboration with AI.',
    },
    music: {
      de: 'Die neuesten YouTube-Uploads von AiMP, automatisch aktualisiert.',
      en: 'The latest YouTube uploads from AiMP, refreshed automatically.',
    },
    social: {
      de: 'Social-Media-Kanäle des AiMP Music Project.',
      en: 'Social media channels of the AiMP Music Project.',
    },
    contact: {
      de: 'Kontaktadresse des AiMP Music Project.',
      en: 'Contact address for the AiMP Music Project.',
    },
    about: {
      de: 'Markus B. aus Bietigheim-Bissingen: Werdegang, Studio-Setup und Inspirationen des Künstlers.',
      en: 'Markus B. from Bietigheim-Bissingen: career, studio setup and the inspirations behind the artist.',
    },
  },
  hero: {
    eyebrow: { de: 'Musikprojekt mit KI', en: 'Music project with AI' },
    title: { de: 'Music created in collab with AI', en: 'Music created in collab with AI' },
    lead: {
      de: 'Cinematische elektronische Musikprojekte, die Markus B. gemeinsam mit KI entwickelt.',
      en: 'Cinematic electronic music projects that Markus B. develops together with AI.',
    },
  },
  images: {
    logo,
    logoAlt: { de: 'Logo des AiMP Music Project', en: 'AiMP Music Project logo' },
    portrait,
    portraitAlt: {
      de: 'AiMP Music Project Artwork mit Porträt von Markus B.',
      en: 'AiMP Music Project artwork showing a portrait of Markus B.',
    },
    portraitTreatment: 'temporary-cutout-pending',
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
      tagline: { de: 'Visuals & Videos', en: 'Visuals & videos' },
    },
    {
      profile: 'aimp',
      id: 'soundcloud',
      name: 'SoundCloud',
      url: 'https://soundcloud.com/aimp-musicproject',
      category: 'listening',
      tagline: { de: 'Skizzen & Sessions', en: 'Sketches & sessions' },
    },
  ],
  youtube: { profile: 'aimp', ...channels.aimp.youtube },
  contact: { email: 'iamb.synthmusic@gmail.com' },
};

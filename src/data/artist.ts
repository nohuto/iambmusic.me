import boytronic from '../assets/profiles/iamb/inspiration/boytronic.jpg';
import eloy from '../assets/profiles/iamb/inspiration/eloy.jpg';
import robertMiles from '../assets/profiles/iamb/inspiration/robert-miles.jpg';
import tangerineDream from '../assets/profiles/iamb/inspiration/tangerine-dream.jpg';
import theArtOfNoise from '../assets/profiles/iamb/inspiration/the-art-of-noise.jpg';
import yello from '../assets/profiles/iamb/inspiration/yello.jpg';
import type { GlanceFact, Inspiration, StudioSetup, TimelineEntry } from './types.ts';

interface ArtistProfile {
  readonly glance: readonly GlanceFact[];
  readonly studio: StudioSetup;
  readonly timeline: readonly TimelineEntry[];
  readonly inspirations: readonly Inspiration[];
}
export const artist: ArtistProfile = {
  glance: [
    {
      label: { de: 'Rolle', en: 'Role' },
      value: { de: 'Music Artist & Producer', en: 'Music artist & producer' },
    },
    {
      label: { de: 'Genre', en: 'Genre' },
      value: { de: 'Elektronische Soundtracks', en: 'Electronic soundtracks' },
    },
    {
      label: { de: 'Standort', en: 'Location' },
      value: { de: 'Bietigheim-Bissingen (Ludwigsburg)', en: 'Bietigheim-Bissingen (Ludwigsburg)' },
    },
    {
      label: { de: 'Jahrgang', en: 'Born' },
      value: { de: '1966', en: '1966' },
    },
  ],
  studio: {
    software: {
      de: 'DAW Cakewalk Sonar, verschiedene VSTs, iZotope Ozone 12 für das Mastering.',
      en: 'DAW Cakewalk Sonar, various VSTs, iZotope Ozone 12 for mastering.',
    },
    hardware: {
      de: 'Yamaha MoXF als Masterkeyboard, Motu M4, Windows-PC. Aus den Anfängen sind einige Synths wie der Roland Jx8P geblieben, aus Platzgründen läuft heute aber alles über Softsynths.',
      en: 'Yamaha MoXF as master keyboard, Motu M4 and a Windows PC. A few synths from the early days remain, such as the Roland Jx8P, but limited space means everything runs on soft synths today.',
    },
  },
  timeline: [
    {
      period: '1985',
      text: {
        de: 'Erster Synth, der Roland Jx8P, und ein Fostex 4-Spur-Kassettenrecorder.',
        en: 'First synth, the Roland Jx8P, and a Fostex 4-track cassette recorder.',
      },
    },
    {
      period: '1986',
      text: { de: 'Roland TR-505 Drumcomputer.', en: 'Roland TR-505 drum machine.' },
    },
    {
      period: '1987',
      text: { de: 'Erster Sequencer: C-LAB für den C64.', en: 'First sequencer: C-LAB for the C64.' },
    },
    {
      period: '1990',
      text: {
        de: 'Erster PC fürs Studium. Einstieg in Cakewalk für DOS, später die Windows-Versionen bis zu Cakewalk Sonar.',
        en: 'First PC for university. Started with Cakewalk for DOS, later the Windows versions up to Cakewalk Sonar.',
      },
    },
    {
      period: '1998',
      text: {
        de: 'Nutzung von Soundfonts auf der PC-Soundblaster-Karte.',
        en: 'Used soundfonts with the PC Sound Blaster card.',
      },
    },
    {
      period: '2002–2005',
      text: {
        de: 'Vater geworden und eine längere Pause eingelegt.',
        en: 'Became a father and took a longer break.',
      },
    },
    {
      period: '2014',
      text: {
        de: 'Yamaha MoXF6. Erstmals Keyboard-Unterricht bis 2015.',
        en: 'Yamaha MoXF6. First keyboard lessons, until 2015.',
      },
    },
    {
      period: '2019',
      text: { de: 'Umstieg auf VST-Instrumente.', en: 'Switched to VST instruments.' },
    },
    {
      period: '2021',
      text: {
        de: 'Einarbeitung in YouTube Studio und Veröffentlichung des ersten vollständigen Tracks.',
        en: 'Started working with YouTube Studio and released the first complete track.',
      },
    },
    {
      period: '2022',
      text: {
        de: 'Beitritt zum Musikvertrieb Artistfy, erster Track auf Spotify und Co., Instagram-Profil erstellt.',
        en: 'Joined the music distributor Artistfy, released the first track on Spotify and others, created an Instagram profile.',
      },
    },
    {
      period: '2023',
      text: { de: 'TikTok-Profil erstellt.', en: 'Created a TikTok profile.' },
    },
    {
      period: '2024',
      text: {
        de: 'Verschiedene Produktionen, insgesamt vier Titel auf Spotify und Co., Anschaffung einer Videosoftware.',
        en: 'Various productions, four titles on Spotify and others, and new video software.',
      },
    },
    {
      period: '2025',
      text: {
        de: 'Beitritt zum KlangKunst TechnoCollective im Februar. Ein sehr kreatives Musikjahr.',
        en: 'Joined the KlangKunst TechnoCollective in February. A very creative musical year.',
      },
    },
    {
      period: '2026',
      text: {
        de: 'Neue Website mit allen Links zur Musik und zu den Musikvideos. Arbeit am Thema Mastering mit iZotope Ozone 12.',
        en: 'New website with all links to the music and the music videos. Working on mastering with iZotope Ozone 12.',
      },
    },
  ],
  inspirations: [
    { name: 'Yello', url: 'https://www.yello.com', image: yello },
    { name: 'Robert Miles', url: 'http://www.robertmiles.net', image: robertMiles },
    { name: 'Boytronic', url: 'http://www.boytronic.de', image: boytronic },
    { name: 'The Art Of Noise', url: 'https://www.theartofnoiseonline.com', image: theArtOfNoise },
    { name: 'Eloy', url: 'https://www.eloy-legacy.com', image: eloy },
    { name: 'Tangerine Dream', url: 'https://www.tangerinedreammusic.com', image: tangerineDream },
  ],
};

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
      value: { de: 'Musiker & Produzent', en: 'Music artist & producer' },
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
      de: 'Ich produziere in Cakewalk Sonar mit verschiedenen VSTs und mastere mit iZotope Ozone 12.',
      en: 'I produce in Cakewalk Sonar with various VSTs and master with iZotope Ozone 12.',
    },
    hardware: {
      de: 'Als Masterkeyboard nutze ich ein Yamaha MoXF, dazu ein Motu M4 und einen Windows PC. Einige Synths aus meinen Anfängen, etwa der Roland JX-8P, sind geblieben. Aus Platzgründen arbeite ich heute aber mit Softsynths.',
      en: 'I use a Yamaha MoXF as my master keyboard, together with a Motu M4 and a Windows PC. A few synths from my early days remain, including the Roland JX-8P, but limited space means I work with soft synths today.',
    },
  },
  timeline: [
    {
      period: '1985',
      text: {
        de: 'Mein erster Synth war der Roland JX-8P, aufgenommen mit einem Fostex Kassettenrecorder mit vier Spuren.',
        en: 'My first synth was the Roland JX-8P, recorded with a Fostex cassette recorder with four tracks.',
      },
    },
    {
      period: '1986',
      text: { de: 'Dazu kam ein Roland TR-505 Drumcomputer.', en: 'I added a Roland TR-505 drum machine.' },
    },
    {
      period: '1987',
      text: { de: 'Mein erster Sequencer war C-LAB für den C64.', en: 'My first sequencer was C-LAB for the C64.' },
    },
    {
      period: '1990',
      text: {
        de: 'Für mein Studium kam der erste PC. Ich begann mit Cakewalk für DOS und wechselte später über die Versionen für Windows zu Cakewalk Sonar.',
        en: 'I got my first PC for university, started with Cakewalk for DOS and later moved through its Windows versions to Cakewalk Sonar.',
      },
    },
    {
      period: '1998',
      text: {
        de: 'Ich nutzte Soundfonts auf der Sound Blaster Karte meines PCs.',
        en: 'I used soundfonts on my PC’s Sound Blaster card.',
      },
    },
    {
      period: '2002-2005',
      text: {
        de: 'Ich wurde Vater und legte eine längere Pause ein.',
        en: 'I became a father and took a longer break.',
      },
    },
    {
      period: '2014',
      text: {
        de: 'Mit dem Yamaha MoXF6 stieg ich wieder ein und nahm bis 2015 erstmals Keyboardunterricht.',
        en: 'I returned with the Yamaha MoXF6 and took my first keyboard lessons through 2015.',
      },
    },
    {
      period: '2019',
      text: { de: 'Ich wechselte zu VSTs.', en: 'I switched to VST instruments.' },
    },
    {
      period: '2021',
      text: {
        de: 'Ich arbeitete mich in YouTube Studio ein und veröffentlichte meinen ersten vollständigen Track.',
        en: 'I learned my way around YouTube Studio and released my first complete track.',
      },
    },
    {
      period: '2022',
      text: {
        de: 'Ich ging zu Artistfy, brachte meinen ersten Track auf Spotify und Co. heraus und startete mein Profil auf Instagram.',
        en: 'I joined the music distributor Artistfy, released my first track on Spotify and other platforms, and started my Instagram profile.',
      },
    },
    {
      period: '2023',
      text: { de: 'Ich startete mein Profil auf TikTok.', en: 'I started my TikTok profile.' },
    },
    {
      period: '2024',
      text: {
        de: 'Ich produzierte verschiedene neue Stücke, hatte nun vier Titel auf Spotify und Co. und holte mir eine Videosoftware.',
        en: 'I produced several new pieces, reached four tracks on Spotify and other platforms, and added video software to my setup.',
      },
    },
    {
      period: '2025',
      text: {
        de: 'Im Februar schloss ich mich dem KlangKunst TechnoCollective an. Es wurde ein sehr kreatives Musikjahr.',
        en: 'In February, I joined the KlangKunst TechnoCollective. It became a very creative year for my music.',
      },
    },
    {
      period: '2026',
      text: {
        de: 'Ich baute diese Website für meine Musik und Musikvideos auf und vertiefte das Mastering mit iZotope Ozone 12.',
        en: 'I built this website for my music and videos and went deeper into mastering with iZotope Ozone 12.',
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

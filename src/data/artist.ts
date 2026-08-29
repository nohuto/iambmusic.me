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
      period: { de: '1985', en: '1985' },
      text: {
        de: 'Erster Synth, den Roland Jx8P und ein Fostex 4-Spur Kassettenrecorder',
        en: 'My first synth, the Roland Jx8P, and a Fostex 4-track cassette recorder',
      },
    },
    {
      period: { de: '1986', en: '1986' },
      text: { de: 'Roland TR-505 Drumcomputer', en: 'Roland TR-505 drum machine' },
    },
    {
      period: { de: '1987', en: '1987' },
      text: { de: 'Erster Sequencer C-LAB für C64', en: 'First sequencer, C-LAB for the C64' },
    },
    {
      period: { de: '1990', en: '1990' },
      text: {
        de: 'Erster PC fürs Studium. Einstieg in die DAW Cakewalk für DOS, später bis heute Windows-Versionen von Cakewalk Sonar',
        en: 'My first PC for university. I started using the Cakewalk DAW for DOS, followed later by the Windows versions of Cakewalk Sonar, which I still use today',
      },
    },
    {
      period: { de: '1998', en: '1998' },
      text: {
        de: 'Nutzung von Soundfonts für meine PC-Soundblaster-Karte',
        en: 'I used SoundFonts with my PC’s Sound Blaster card',
      },
    },
    {
      period: { de: '2002/05', en: '2002/05' },
      text: {
        de: 'Bin ich Vater geworden und habe eine längere Pause eingelegt.',
        en: 'I became a father and took a longer break.',
      },
    },
    {
      period: { de: '2014', en: '2014' },
      text: {
        de: 'Yamaha MoXF6. Erstmals Keyboard Unterricht bis 2015',
        en: 'Yamaha MoXF6. I took keyboard lessons for the first time, through 2015',
      },
    },
    {
      period: { de: '2019', en: '2019' },
      text: { de: 'Umstieg auf VST-Instrumente.', en: 'Switched to VST instruments.' },
    },
    {
      period: { de: '2021', en: '2021' },
      text: {
        de: 'Habe ich mich mit YouTube-Studio beschäftigt und meinen ersten vollständigen Track veröffentlicht.',
        en: 'I learned how to use YouTube Studio and released my first complete track.',
      },
    },
    {
      period: { de: '2022', en: '2022' },
      text: {
        de: 'Beitritt Musikvertrieb Artistfy. Erster Track auf Spotify und Co. veröffentlicht. Instagram-Profil erstellt.',
        en: 'Joined the Artistfy music distribution service. Released my first track on Spotify and other platforms. Created my Instagram profile.',
      },
    },
    {
      period: { de: '2023', en: '2023' },
      text: { de: 'TikTok Profil erstellt.', en: 'Created my TikTok profile.' },
    },
    {
      period: { de: 'bis 2024', en: 'through 2024' },
      text: {
        de: 'Verschiedene Produktionen. Insgesamt 4 Titel auf Spotify und Co. Anschaffung einer Videosoftware.',
        en: 'Various productions. A total of 4 tracks on Spotify and other platforms. Purchased video software.',
      },
    },
    {
      period: { de: '18.02.25', en: '18 February 2025' },
      text: {
        de: 'Bin ich dem KlangKunst TechnoCollective beigetreten. (www.technocollective.de)',
        en: 'I joined the KlangKunst TechnoCollective. (www.technocollective.de)',
      },
    },
    {
      period: { de: '2025', en: '2025' },
      text: {
        de: 'War ein sehr musikalisch kreatives Jahr für mich.',
        en: 'It was a very creative year for me musically.',
      },
    },
    {
      period: { de: '2026', en: '2026' },
      text: {
        de: 'Website www.iambmusic.me mit allen Links zu meiner Musik und Musikvideos. An dieser Stelle, vielen Dank an nohuto der das hier ermöglicht hat!',
        en: 'Website www.iambmusic.me with all the links to my music and music videos. I would like to take this opportunity to thank nohuto, who made all of this possible!',
      },
    },
    {
      period: { de: 'noch in 2026', en: 'later in 2026' },
      text: {
        de: 'Ich beschäftige mich mit dem Thema Mastering, um die Qualität meiner Songs zu verbessern. Habe mir dazu von Izotope - Ozone 12 angeschafft.',
        en: 'I am learning about mastering to improve the quality of my songs. For this, I purchased iZotope Ozone 12.',
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

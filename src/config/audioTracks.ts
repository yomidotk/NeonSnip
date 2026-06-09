import { assetUrl } from '../utils/assetUrl';

export interface AudioTrack {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export const AUDIO_TRACKS: AudioTrack[] = [
  { id: 'code-chill', name: 'Code Chill', url: assetUrl('audio/code-chill.mp3'), icon: '💻' },
  { id: 'good-night', name: 'Good Night', url: assetUrl('audio/good-night.mp3'), icon: '🌙' },
  { id: 'mirostar', name: 'Mirostar', url: assetUrl('audio/mirostar.mp3'), icon: '✨' },
  { id: 'pulsebox', name: 'Pulsebox', url: assetUrl('audio/pulsebox.mp3'), icon: '🎛️' },
  { id: 'the-mountain', name: 'The Mountain', url: assetUrl('audio/the_mountain.mp3'), icon: '🏔️' },
];

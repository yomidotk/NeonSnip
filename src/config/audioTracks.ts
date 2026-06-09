export interface AudioTrack {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export const AUDIO_TRACKS: AudioTrack[] = [
  { id: 'code-chill', name: 'Code Chill', url: '/audio/code-chill.mp3', icon: '💻' },
  { id: 'good-night', name: 'Good Night', url: '/audio/good-night.mp3', icon: '🌙' },
  { id: 'mirostar', name: 'Mirostar', url: '/audio/mirostar.mp3', icon: '✨' },
  { id: 'pulsebox', name: 'Pulsebox', url: '/audio/pulsebox.mp3', icon: '🎛️' },
  { id: 'the-mountain', name: 'The Mountain', url: '/audio/the_mountain.mp3', icon: '🏔️' },
];

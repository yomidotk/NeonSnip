import { create } from 'zustand';

export type CursorStyle = 'block' | 'line' | 'underscore';
export type RevealMode = 'char' | 'line';

export interface StoreState {
  // Code Input
  code: string;
  language: string;
  setCode: (code: string) => void;
  setLanguage: (lang: string) => void;

  // Theme Engine
  themeId: string;
  accentHue: number;
  setThemeId: (id: string) => void;
  setAccentHue: (hue: number) => void;

  // Animation Config
  typingSpeedWpm: number;
  cursorStyle: CursorStyle;
  cursorBlinkRate: number;
  revealMode: RevealMode;
  fontSize: number;
  padding: number;
  showScanlines: boolean;
  showLineNumbers: boolean;

  setTypingSpeed: (wpm: number) => void;
  setCursorStyle: (style: CursorStyle) => void;
  setCursorBlinkRate: (rate: number) => void;
  setRevealMode: (mode: RevealMode) => void;
  setFontSize: (size: number) => void;
  setPadding: (pad: number) => void;
  setShowScanlines: (show: boolean) => void;
  setShowLineNumbers: (show: boolean) => void;

  // Audio Config
  audioTrackId: string | null;
  audioVolume: number;
  setAudioTrackId: (id: string | null) => void;
  setAudioVolume: (volume: number) => void;

  // Export State
  isExporting: boolean;
  exportProgress: number;
  exportStage: string;
  setExportState: (isExporting: boolean, progress: number, stage: string) => void;
}

const defaultCode = `function generateNeonReel() {
  const canvas = document.getElementById('reel');
  const ctx = canvas.getContext('2d');
  
  // Set up the dark mode vibe
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1080, 1920);
  
  // Add some aesthetic glow
  ctx.shadowColor = '#8b5cf6';
  ctx.shadowBlur = 20;
  
  console.log("Exporting to TikTok/Shorts/Reels...");
}

generateNeonReel();`;

export const useStore = create<StoreState>((set) => ({
  // Code Input
  code: defaultCode,
  language: 'javascript',
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),

  // Theme Engine
  themeId: 'neon-tokyo',
  accentHue: 280, // Default to a purple hue
  setThemeId: (themeId) => set({ themeId }),
  setAccentHue: (accentHue) => set({ accentHue }),

  // Animation Config
  typingSpeedWpm: 150,
  cursorStyle: 'block',
  cursorBlinkRate: 500, // ms
  revealMode: 'char',
  fontSize: 40,
  padding: 60,
  showScanlines: true,
  showLineNumbers: true,

  setTypingSpeed: (wpm) => set({ typingSpeedWpm: wpm }),
  setCursorStyle: (style) => set({ cursorStyle: style }),
  setCursorBlinkRate: (rate) => set({ cursorBlinkRate: rate }),
  setRevealMode: (mode) => set({ revealMode: mode }),
  setFontSize: (size) => set({ fontSize: size }),
  setPadding: (pad) => set({ padding: pad }),
  setShowScanlines: (show) => set({ showScanlines: show }),
  setShowLineNumbers: (show) => set({ showLineNumbers: show }),

  // Audio Config
  audioTrackId: null,
  audioVolume: 0.8,
  setAudioTrackId: (id) => set({ audioTrackId: id }),
  setAudioVolume: (volume) => set({ audioVolume: volume }),

  // Export State
  isExporting: false,
  exportProgress: 0,
  exportStage: '',
  setExportState: (isExporting, progress, stage) => set({ isExporting, exportProgress: progress, exportStage: stage }),
}));
